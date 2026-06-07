import { generateConfigSchema } from '@/config/config-schema.js'
import { resolveProvider } from '@/config/resolve-config.js'
import { getGitCommitsInfo } from '@/lib/git.js'
import { generateText, stepCountIs } from 'ai'
import { numberClamp } from 'daily-code'
import { simpleGit } from 'simple-git'
import z from 'zod'
import { buildCommitsMarkdown, buildSystemPrompt } from './prompt.js'
import { generateTools } from './tools.js'

type GenerateOptions = z.infer<typeof generateConfigSchema> & {
  logger?: (...args: unknown[]) => void
}

export async function generateReleaseNote(
  cwd: string,
  options: GenerateOptions
) {
  const git = simpleGit(cwd)

  const gitResult = await getGitCommitsInfo(git, options.target)
  if (gitResult.commits.length < 2) {
    throw new Error(
      `Not enough commits found between the specified targets to generate release notes. Found ${gitResult.commits.length} commit(s).`
    )
  }

  options.logger?.(`Previous target: ${JSON.stringify(gitResult.prev)}`)
  options.logger?.(`Current target: ${JSON.stringify(gitResult.current)}`)

  // throw new Error('Not implemented yet')

  const provider = await resolveProvider(options.provider, options)
  if (!provider) {
    throw new Error(`Unsupported provider: ${options.provider}`)
  }

  const commitsMarkdown = buildCommitsMarkdown(gitResult.commits)
  options.logger?.('='.repeat(80))
  options.logger?.(commitsMarkdown)
  options.logger?.('='.repeat(80))

  const steps =
    options.steps ?? numberClamp((gitResult.commits.length + 1) * 2, 10, 100)
  options.logger?.(
    `Generating with ${JSON.stringify(options.provider)} using "${options.model}" in ${steps} steps...`
  )

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
    stopWhen: stepCountIs(steps),

    system: buildSystemPrompt(Math.floor(steps / 1.5)),
    messages: [
      { role: 'user', content: 'Here are the commits related to the release:' },
      { role: 'user', content: commitsMarkdown.trim() },
      ...(options.instructions
        ? [{ role: 'user' as const, content: options.instructions }]
        : []),
    ],
  })

  return {
    prev: gitResult.prev,
    current: gitResult.current,
    commits: gitResult.commits,

    note: llmResult.text,
    output: llmResult.output,
    provider: {
      usage: llmResult.totalUsage,
      response: llmResult.response,
    },
  }
}
