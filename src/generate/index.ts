import { generateConfigSchema } from '@/config/config-schema.js'
import { resolveProvider } from '@/config/resolve-config.js'
import { SYSTEM_PROMPT } from '@/constants/prompts.js'
import { getGitCommitHash, getGitCommitsInfo } from '@/lib/git.js'
import * as ai from 'ai'
import { simpleGit } from 'simple-git'
import z from 'zod'

export async function generateReleaseNote(
  cwd: string,
  options: z.infer<typeof generateConfigSchema>
) {
  const git = simpleGit(cwd)
  const info = await getGitCommitsInfo(
    git,
    await getGitCommitHash(git, options.prev),
    await getGitCommitHash(git, options.current)
  )

  console.log(info)

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
