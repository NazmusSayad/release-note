import { generateConfigSchema } from '@/config/config-schema.js'
import { resolveProvider } from '@/config/resolve-config.js'
import { getGitCommitsInfo } from '@/lib/git.js'
import { generateText, stepCountIs } from 'ai'
import { numberClamp } from 'daily-code'
import { simpleGit } from 'simple-git'
import z from 'zod'
import { buildSystemPrompt, buildUserPrompt } from './prompt.js'
import { generateTools } from './tools.js'

type GenerateOptions = z.infer<typeof generateConfigSchema> & {
  logger?: (...args: unknown[]) => void
}

export async function generateReleaseNote(
  cwd: string,
  options: GenerateOptions
) {
  const git = simpleGit(cwd)
  const commits = await getGitCommitsInfo(git, options.match)

  const provider = await resolveProvider(options.provider, options)
  if (!provider) {
    throw new Error(`Unsupported provider: ${options.provider}`)
  }

  const steps = options.steps ?? numberClamp((commits.length + 1) * 2, 10, 100)
  const promptSteps = Math.floor(steps / 1.5)

  const result = await generateText({
    model: provider(options.model),

    prompt: buildUserPrompt(commits).trim(),
    system: buildSystemPrompt(promptSteps).trim(),

    tools: generateTools(git, options.logger),
    stopWhen: stepCountIs(steps),
  })

  return {
    commits,
    note: result.text,

    provider: {
      usage: result.totalUsage,
      response: result.response,
    },
  }
}
