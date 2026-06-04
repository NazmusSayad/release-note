import { generateConfigSchema } from '@/config/config-schema.js'
import { resolveProvider } from '@/config/resolve-config.js'
import { getGitCommitHash, getGitCommitsInfo } from '@/lib/git.js'
import { generateText, stepCountIs } from 'ai'
import { simpleGit } from 'simple-git'
import z from 'zod'
import { buildPrompt, SYSTEM_PROMPT } from './prompt.js'
import { generateTools } from './tools.js'

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

  const result = await generateText({
    model: provider(options.model),

    system: SYSTEM_PROMPT.trim(),
    prompt: buildPrompt(info).trim(),

    tools: generateTools(git),
    stopWhen: stepCountIs(options.steps || info.length + 1),
  })

  console.log({
    text: result.text,
    output: result.output,
    content: result.content,
  })

  return {
    note: result.text,
    commits: info,
  }
}
