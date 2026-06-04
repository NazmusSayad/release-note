import { tool, ToolSet } from 'ai'
import { SimpleGit } from 'simple-git'
import z from 'zod'

function parseLsTree(output: string): string[] {
  return output
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => {
      const tabIdx = line.indexOf('\t')
      return tabIdx >= 0 ? line.slice(tabIdx + 1) : ''
    })
}

export function generateTools(
  git: SimpleGit,
  logger?: (...args: unknown[]) => void
): ToolSet {
  return {
    check_diff: tool({
      description:
        'Get the full diff of a specific commit. Returns the patch showing all changes (additions, deletions, modifications) introduced by the commit.',
      inputSchema: z.object({
        commithash: z
          .string()
          .describe(
            'The commit hash, tag, branch, or any other git ref resolvable by git rev-parse.'
          ),
      }),
      execute: async ({ commithash }) => {
        logger?.(`[check_diff] fetching diff for ${commithash}`)
        const diff = await git.raw([
          'show',
          '--no-color',
          '--pretty=format:',
          commithash,
        ])
        logger?.(`[check_diff] ${commithash} -> ${diff.length} chars of diff`)
        return diff
      },
    }),
    browse_code: tool({
      description:
        'Browse the code at a specific commit. If the path points to a file, returns its content. If the path points to a folder, returns the list of files and sub-folders it contains. Pass an empty string for the path to browse the repository root.',
      inputSchema: z.object({
        commithash: z
          .string()
          .describe(
            'The commit hash, tag, branch, or any other git ref resolvable by git rev-parse.'
          ),
        path: z
          .string()
          .describe(
            'Path to a file or folder within the repository, relative to the repo root. Use forward slashes. Pass an empty string for the root.'
          ),
      }),
      execute: async ({ commithash, path }) => {
        const normalized = path.replace(/^\/+|\/+$/g, '')
        logger?.(
          `[browse_code] ${commithash} @ ${normalized === '' ? '/' : normalized}`
        )

        if (normalized === '') {
          const output = await git.raw(['ls-tree', commithash])
          const items = parseLsTree(output)
          logger?.(`[browse_code] root -> folder with ${items.length} item(s)`)
          return { type: 'folder', items }
        }

        const ref = `${commithash}:${normalized}`
        let objectType: string
        try {
          objectType = (await git.raw(['cat-file', '-t', ref])).trim()
        } catch {
          logger?.(`[browse_code] ${ref} does not exist`)
          return { error: "doesn't exists" }
        }

        if (objectType === 'tree') {
          const output = await git.raw(['ls-tree', ref])
          const items = parseLsTree(output)
          logger?.(
            `[browse_code] ${normalized} -> folder with ${items.length} item(s)`
          )
          return { type: 'folder', items }
        }

        if (objectType === 'blob') {
          const content = await git.show(ref)
          logger?.(
            `[browse_code] ${normalized} -> file with ${content.length} chars`
          )
          return { type: 'file', content }
        }

        logger?.(
          `[browse_code] ${ref} has unsupported object type "${objectType}"`
        )
        return { error: "doesn't exists" }
      },
    }),
  }
}
