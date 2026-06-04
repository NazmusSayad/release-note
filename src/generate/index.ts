import { generateConfigSchema } from '@/config/config-schema.js'
import { SYSTEM_PROMPT } from '@/constants/prompts.js'
import { resolveGitCommitHashes as getGitCommitHashes } from '@/lib/commit-hash.js'
import * as ai from 'ai'
import z from 'zod'
import { resolveProvider } from '../config/resolve-config.js'

export async function generateReleaseNote(
  cwd: string,
  options: z.infer<typeof generateConfigSchema>
) {
  const hashes = await getGitCommitHashes(cwd, options.prev, options.current)
  if (hashes.length < 2) {
    throw new Error(`Could not resolve current version: ${options.current}`)
  }

  const provider = await resolveProvider(options.provider, options)
  if (!provider) {
    throw new Error(`Unsupported provider: ${options.provider}`)
  }

  const response = await ai.generateText({
    model: provider('wrong-model'),
    system: SYSTEM_PROMPT,
    prompt: 'DO IT',
  })

  return {
    note: response.text,
  }
}
