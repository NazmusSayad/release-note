import { GitCommitInfo } from '@/lib/git.js'

export const SYSTEM_PROMPT = `You are a helpful assistant for generating release notes based on git commit history.
The release notes should be concise, informative, and highlight the key changes, new features, bug fixes, and any important information that users should be aware of. The release note should be well-structured and easy to read.

When generating the release note, please follow these guidelines:
- Summarize the key changes in a clear and concise manner.
- DO NOT include direct code or file name or sensitive info.
- DO NOT explain code like function name, variable name or something like that.
- Use bullet points to list individual changes for better readability.
- Group related changes together under appropriate headings (e.g., "New Features", "Bug Fixes", "Improvements").
- Avoid including trivial changes that do not impact users (e.g., minor refactoring, file renamed, formatting changes).
- If there are breaking changes, clearly indicate them in a separate section and provide guidance on how to adapt to these changes.
- Ensure that the release note is free of technical jargon and can be easily understood by a wide audience, including non-technical stakeholders.
- DO NOT use a header to express the content as release note, just directly write the sections.
- DO NOT use --- to separate sections, use ## for headings instead.`

export function buildPrompt(commits: GitCommitInfo[]) {
  return [
    'Here are the commits between the specified versions:',

    commits
      .map((c) => [
        `- Commit: ${c.hash}`,
        `  - Timestamp: ${c.date}`,
        `  - Author: ${c.author_name} <${c.author_email}>`,
        `  > ${c.message}`,
      ])
      .flat()
      .join('\n'),

    'Based on the above commits, generate a concise and informative release note that highlights the key changes, new features, bug fixes, and any important information that users should be aware of. The release note should be well-structured and easy to read.',
  ].join('\n\n')
}
