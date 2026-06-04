import { gitCommitTargetSchema } from '@/config/config-schema.js'
import { simpleGit, type SimpleGit } from 'simple-git'
import z from 'zod'

async function resolveTargetHashes(
  git: SimpleGit,
  target: z.infer<typeof gitCommitTargetSchema>
): Promise<string[]> {
  if ('tag' in target) {
    const regex = new RegExp(target.tag)
    const { all: tags } = await git.tags()
    const matched = tags.filter((tag) => regex.test(tag))
    if (matched.length === 0) {
      throw new Error(`No tags matched pattern: ${target.tag}`)
    }

    const hashes: string[] = []
    for (const tag of matched) {
      const hash = await git.revparse([tag])
      hashes.push(hash.trim())
    }
    return hashes
  }

  if ('commit' in target) {
    const hash = await git.revparse([target.commit])
    return [hash.trim()]
  }

  throw new Error('Invalid target: must contain either "tag" or "commit"')
}

export async function resolveGitCommitHashes(
  cwd: string,
  prev: z.infer<typeof gitCommitTargetSchema>,
  current: z.infer<typeof gitCommitTargetSchema>
): Promise<string[]> {
  const git = simpleGit(cwd)
  const fromHashes = await resolveTargetHashes(git, prev)
  const toHashes = await resolveTargetHashes(git, current)
  return [...fromHashes, ...toHashes]
}
