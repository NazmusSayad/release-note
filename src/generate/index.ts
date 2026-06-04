import { generateConfigSchema } from '@/config/config-schema.js'
import { resolveProvider } from '@/config/resolve-config.js'
import { SYSTEM_PROMPT } from '@/constants/prompts.js'
import { getGitCommitHash, getGitCommitsInfo } from '@/lib/git.js'
import { generateText } from 'ai'
import { simpleGit } from 'simple-git'
import z from 'zod'
import { buildPrompt } from './prompt.js'

export async function generateReleaseNote(
  cwd: string,
  options: z.infer<typeof generateConfigSchema>
) {
  const git = simpleGit(cwd)
  const info = await getGitCommitsInfo(
    git,
    await getGitCommitHash(git, options.prev, 1),
    await getGitCommitHash(git, options.current)
  )

  const provider = await resolveProvider(options.provider, options)
  if (!provider) {
    throw new Error(`Unsupported provider: ${options.provider}`)
  }

  const response = await generateText({
    model: provider(options.model),
    prompt: buildPrompt(info),
    system: SYSTEM_PROMPT,
  })

  return {
    note: response.text,
    commits: info,
  }
}
