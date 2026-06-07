import {
  combinedTargetSchema,
  gitCommitTargetSchema,
} from '@/config/config-schema.js'
import { objectPick, Prettify } from 'daily-code'
import { DefaultLogFields, type SimpleGit } from 'simple-git'
import z from 'zod'

export type GitCommitInfo = Prettify<
  Pick<
    DefaultLogFields,
    'hash' | 'date' | 'message' | 'author_name' | 'author_email'
  >
>

export type MatchResult = {
  tag?: string
  hash: string
}

async function getGitCommitHash(
  git: SimpleGit,
  target: z.infer<typeof combinedTargetSchema>,
  cursor?: MatchResult
): Promise<MatchResult> {
  if ('tag' in target) {
    const tags = await git.tags({ '--sort': '-v:refname' })

    const matched = tags.all.filter((tag) =>
      typeof target.tag === 'string' ? tag === target.tag : target.tag.test(tag)
    )

    if (matched.length === 0) {
      throw new Error(`No tags matched pattern: ${target.tag}`)
    }

    let index: number
    if (cursor?.tag) {
      const cursorIndex = matched.findIndex((tag) => tag === cursor.tag)
      if (cursorIndex === -1) {
        throw new Error(`Cursor tag "${cursor.tag}" not found in matched tags`)
      }

      index = cursorIndex + 1 + (target.offset ?? 0)
    } else {
      index = target.offset ?? 0
    }

    if (index < 0 || index >= matched.length) {
      throw new Error(
        `Offset ${index} out of range: only ${matched.length} tag(s) matched pattern ${target.tag}`
      )
    }

    const tag = matched[index]
    const hash = await git.revparse([tag])
    return { tag, hash: hash.trim() }
  }

  if ('commit' in target) {
    const hash = await git.revparse([target.commit])
    return { hash: hash.trim() }
  }

  throw new Error('Invalid target: must contain either "tag" or "commit"')
}

export async function getGitCommitsInfo(
  git: SimpleGit,
  match: z.infer<typeof gitCommitTargetSchema>
) {
  const current = await getGitCommitHash(
    git,
    'current' in match ? match.current : match
  )

  const prev = await getGitCommitHash(
    git,
    'prev' in match ? match.prev : match,
    current
  )

  const commitLogs = await git.log({
    from: prev.hash,
    to: current.hash,
  })

  return {
    prev,
    current,
    commits: [...commitLogs.all].map<GitCommitInfo>((c) =>
      objectPick(c, ['hash', 'date', 'message', 'author_name', 'author_email'])
    ),
  }
}
