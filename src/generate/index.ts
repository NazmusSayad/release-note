import { generateConfigSchema } from '@/config/config-schema.js'
import { SYSTEM_PROMPT } from '@/constants/prompts.js'
import { resolveGitCommitHash } from '@/lib/git-commit.js'
import * as ai from 'ai'
import z from 'zod'
import { resolveProvider } from '../config/resolve-config.js'

export async function generateReleaseNote(
  cwd: string,
  options: z.infer<typeof generateConfigSchema>
): Promise<string> {
  const prevVersion = await resolveGitCommitHash(cwd, options.prev)
  if (!prevVersion) {
    throw new Error(`Could not resolve previous version: ${options.prev}`)
  }

  const currentVersion = await resolveGitCommitHash(cwd, options.current)
  if (!currentVersion) {
    throw new Error(`Could not resolve current version: ${options.current}`)
  }

  const provider = await resolveProvider(options.provider, options)
  if (!provider) {
    throw new Error(`Unsupported provider: ${options.provider}`)
  }

  const response = await ai.generateText({
    model: provider(options.model),
    system: SYSTEM_PROMPT,
    prompt: 'DO IT',
  })

  return response.text
}
