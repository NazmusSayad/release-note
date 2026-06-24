import { generateConfigSchema } from '@/config/config-schema.js'
import { resolveProvider } from '@/config/resolve-config.js'
import {
  DEFAULT_PROVIDER_PACKAGE,
  DEFAULT_TARGET_REGEX,
} from '@/constants/config.js'
import { getGitCommitsInfo, GitCommitInfo, MatchResult } from '@/lib/git.js'
import { generateText, LanguageModelUsage, stepCountIs } from 'ai'
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

  const llmResult = await generateText({
    model: provider(options.model),

    temperature: options.temperature,
    topP: options.topP,
    topK: options.topK,

    maxRetries: options.maxRetries,
    maxOutputTokens: options.maxOutputTokens,

    timeout: options.timeout,
    toolChoice: options.toolChoice,
    tools: generateTools(git, options.logger),
    stopWhen: stepCountIs(options.steps ?? 100),

    system: options.system ?? buildSystemPrompt(),
    messages: [
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
    ],
  })

  return {
    note: llmResult.text,
    output: llmResult.output,

    prev: gitResult.prev,
    current: gitResult.current,
    commits: selectedCommits,

    provider: {
      usage: llmResult.totalUsage,
      response: llmResult.response,
    },
  }
}
