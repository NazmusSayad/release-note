import { gitCommitTargetSchema } from '@/config/config-schema.js'
import { objectPick, Prettify } from 'daily-code'
import { DefaultLogFields, type SimpleGit } from 'simple-git'
import z from 'zod'

export type GitCommitInfo = Prettify<
  Pick<
    DefaultLogFields,
    'hash' | 'date' | 'message' | 'author_name' | 'author_email'
  >
>

async function getGitCommitHash(
  git: SimpleGit,
  target: { tag: string | RegExp; offset?: number } | { commit: string },
  defaultOffset: number
): Promise<string> {
  if ('tag' in target) {
    const offset = target.offset ?? defaultOffset
    const targetRegex =
      target.tag instanceof RegExp ? target.tag : new RegExp(target.tag)

    const tags = await git.tags({ '--sort': '-v:refname' })

    const matched = tags.all.filter((tag) => targetRegex.test(tag))
    if (matched.length === 0) {
      throw new Error(`No tags matched pattern: ${target.tag}`)
    }

    if (offset < 0 || offset >= matched.length) {
      throw new Error(
        `Offset ${offset} out of range: only ${matched.length} tag(s) matched pattern ${target.tag}`
      )
    }

    const tag = matched[offset]
    const hash = await git.revparse([tag])
    return hash.trim()
  }

  if ('commit' in target) {
    const hash = await git.revparse([target.commit])
    return hash.trim()
  }

  throw new Error('Invalid target: must contain either "tag" or "commit"')
}

export async function getGitCommitsInfo(
  git: SimpleGit,
  match: z.infer<typeof gitCommitTargetSchema>
): Promise<GitCommitInfo[]> {
  const prev = await getGitCommitHash(
    git,
    'prev' in match ? match.prev : match,
    1
  )

  const current = await getGitCommitHash(
    git,
    'current' in match ? match.current : match,
    0
  )

  const log = await git.log({ from: prev, to: current })

  return [...log.all].map((c) =>
    objectPick(c, ['hash', 'date', 'message', 'author_name', 'author_email'])
  )
}
