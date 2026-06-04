import { GitCommitInfo } from '@/lib/git.js'

function buildCommitsPrompt(commits: GitCommitInfo[]) {
  return [
    commits.map((c) =>
      [
        `- ${c.hash} (Timestamp: ${c.date}; Author: ${c.author_name} <${c.author_email}>)`,
        `  > ${c.message}`,
      ].join('\n')
    ),
  ]
    .flat()
    .join('\n')
}

export function buildPrompt(commits: GitCommitInfo[]) {
  return [
    'Here are the commits between the specified versions:',
    buildCommitsPrompt(commits),
    'Based on the above commits, generate a concise and informative release note that highlights the key changes, new features, bug fixes, and any important information that users should be aware of. The release note should be well-structured and easy to read.',
  ].join('\n\n')
}
