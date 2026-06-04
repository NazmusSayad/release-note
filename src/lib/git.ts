import { gitCommitTargetSchema } from '@/config/config-schema.js'
import { Prettify } from 'daily-code'
import { DefaultLogFields, ListLogLine, type SimpleGit } from 'simple-git'
import z from 'zod'

export async function getGitCommitHash(
  git: SimpleGit,
  target: z.infer<typeof gitCommitTargetSchema>,
  offset = 0
): Promise<string> {
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
    return hashes[0]
  }

  if ('commit' in target) {
    const hash = await git.revparse([target.commit])
    return hash.trim()
  }

  throw new Error('Invalid target: must contain either "tag" or "commit"')
}

export async function getGitCommitsInfo(
  git: SimpleGit,
  prev: string,
  current: string
): Promise<Prettify<DefaultLogFields & ListLogLine>[]> {
  const log = await git.log({ from: prev, to: current })
  return [...log.all]
}
