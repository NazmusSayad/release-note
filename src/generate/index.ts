import { generateConfigSchema } from '@/config/config-schema.js'
import { resolveProvider } from '@/config/resolve-config.js'
import { getGitCommitHash, getGitCommitsInfo } from '@/lib/git.js'
import { generateText, stepCountIs } from 'ai'
import { simpleGit } from 'simple-git'
import z from 'zod'
import { buildSystemPrompt, buildUserPrompt } from './prompt.js'
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

  const maxSteps = options.steps ?? info.length + 1
  const result = await generateText({
    model: provider(options.model),

    prompt: buildUserPrompt(info).trim(),
    system: buildSystemPrompt(maxSteps).trim(),

    tools: generateTools(git),
    stopWhen: stepCountIs(maxSteps),
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
