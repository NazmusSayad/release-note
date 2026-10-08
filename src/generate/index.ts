import { generateConfigSchema } from '@/config/config-schema.js'
import { resolveProvider } from '@/config/resolve-config.js'
import {
  DEFAULT_GENERATION_RETRIES,
  DEFAULT_PROVIDER_PACKAGE,
  DEFAULT_STEP_TIMEOUT_MS,
  DEFAULT_TARGET_REGEX,
} from '@/constants/config.js'
import { getGitCommitsInfo, GitCommitInfo, MatchResult } from '@/lib/git.js'
import { generateText, LanguageModelUsage, ModelMessage, stepCountIs } from 'ai'
import { simpleGit } from 'simple-git'
import z from 'zod'
import { buildMarkdownCommitsList, buildSystemPrompt } from './prompt.js'
import { generateTools } from './tools.js'

type GenerateOptions = z.infer<typeof generateConfigSchema> & {
  logger?: (...args: unknown[]) => void
  filter?: (
    commit: GitCommitInfo,
    commitIndex: number,
    commits: GitCommitInfo[]
  ) => boolean
}

type GenerateResult = {
  note: string
  output: string

  prev: MatchResult
  current: MatchResult
  commits: GitCommitInfo[]

  provider?: {
    usage: LanguageModelUsage
    response: Awaited<ReturnType<typeof generateText>>['response']
  }
}

export async function generateReleaseNote(
  cwd: string,
  options: GenerateOptions
): Promise<GenerateResult> {
  const git = simpleGit(cwd)
  const gitResult = await getGitCommitsInfo(
    git,
    options.target ?? { tag: DEFAULT_TARGET_REGEX }
  )

  options.logger?.(`Previous target: ${JSON.stringify(gitResult.prev)}`)
  options.logger?.(`Current target: ${JSON.stringify(gitResult.current)}`)

  const provider = await resolveProvider(
    options.provider ?? DEFAULT_PROVIDER_PACKAGE,
    options
  )
  if (!provider) {
    throw new Error(`Unsupported provider: ${options.provider}`)
  }

  const selectedCommits = options.filter
    ? gitResult.commits.filter(options.filter)
    : gitResult.commits

  if (selectedCommits.length === 0) {
    const note = options.emptyMessage || '_No notable changes in this release._'

    return {
      note: note,
      output: note,

      prev: gitResult.prev,
      current: gitResult.current,
      commits: selectedCommits,
    }
  }

  const markdownCommitsList = buildMarkdownCommitsList(selectedCommits)
  options.logger?.('='.repeat(80))
  options.logger?.(markdownCommitsList)
  options.logger?.('='.repeat(80))

  let failureReason = ''
  let completedMessages: ModelMessage[] = []

  const initialMessages: ModelMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Here are the commits related to the release:',
        },
        {
          type: 'text',
          text: markdownCommitsList.trim(),
        },
      ],
    },

    ...(options.instructions
      ? [{ role: 'user' as const, content: options.instructions }]
      : []),
  ]

  for (let attempt = 0; attempt <= DEFAULT_GENERATION_RETRIES; attempt++) {
    const resumeMessages = completedMessages
    let llmResult: Awaited<ReturnType<typeof generateText>>

    try {
      llmResult = await generateText({
        model: provider(options.model),

        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK,

        maxRetries: options.maxRetries,
        maxOutputTokens: options.maxOutputTokens,

        timeout: {
          totalMs: options.timeout,
          stepMs: DEFAULT_STEP_TIMEOUT_MS,
        },
        toolChoice: options.toolChoice,
        tools: generateTools(git, options.logger),
        stopWhen: stepCountIs(options.steps ?? 1000),

        system: options.system ?? buildSystemPrompt(),
        messages: [...initialMessages, ...resumeMessages],
        onStepFinish: (step) => {
          if (step.finishReason === 'tool-calls') {
            completedMessages = [...resumeMessages, ...step.response.messages]
          }
        },
      })
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'AbortError') {
        throw error
      }

      failureReason = 'step timed out'
      options.logger?.(
        `Generation attempt ${attempt + 1} failed: ${failureReason}`
      )
      continue
    }

    if (llmResult.finishReason === 'stop') {
      return {
        note: llmResult.text,
        output: llmResult.text,

        prev: gitResult.prev,
        current: gitResult.current,
        commits: selectedCommits,

        provider: {
          usage: llmResult.totalUsage,
          response: llmResult.response,
        },
      }
    }

    failureReason = `finishReason: "${llmResult.finishReason}", rawFinishReason: "${llmResult.rawFinishReason}"`
    options.logger?.(
      `Generation attempt ${attempt + 1} failed: ${failureReason}`
    )
  }

  throw new Error(
    `Release note generation failed after ${DEFAULT_GENERATION_RETRIES + 1} attempt(s) (${failureReason})`
  )
}
