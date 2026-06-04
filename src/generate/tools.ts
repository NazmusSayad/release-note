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

export function generateTools(git: SimpleGit): ToolSet {
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
        return await git.raw([
          'show',
          '--no-color',
          '--pretty=format:',
          commithash,
        ])
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

        if (normalized === '') {
          const output = await git.raw(['ls-tree', commithash])
          return { type: 'folder', items: parseLsTree(output) }
        }

        const ref = `${commithash}:${normalized}`
        let objectType: string
        try {
          objectType = (await git.raw(['cat-file', '-t', ref])).trim()
        } catch {
          return { error: "doesn't exists" }
        }

        if (objectType === 'tree') {
          const output = await git.raw(['ls-tree', ref])
          return { type: 'folder', items: parseLsTree(output) }
        }

        if (objectType === 'blob') {
          const content = await git.show(ref)
          return { type: 'file', content }
        }

        return { error: "doesn't exists" }
      },
    }),
  }
}
