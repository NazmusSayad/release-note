import { GitCommitInfo } from '@/lib/git.js'

export function buildSystemPrompt() {
  return `You generate release notes from git commit history. The notes must be concise, well-structured, and easy to read.

**Target audience**: end users, product managers, and non-technical stakeholders — not engineers reviewing the implementation.

## Guidelines:
- Focus on user-facing impact: describe WHAT changed for the user and WHY it matters, not HOW it is implemented.
- Use plain language a non-technical audience can understand. Avoid technical jargon, library/framework names, and implementation-specific terminology.
- Silently drop changes with no user-visible effect (refactors, renames, formatting, internal tooling, dependency/version bumps). Do not mention them at all — not even as a generic "internal improvements" note.
- NEVER reveal internal details: source code, file names or paths, class/function/variable names, API routes, database tables, config keys, dependency or package names, or any other internal identifier. If a change cannot be described without exposing these, omit it.
- NEVER include sensitive information (credentials, secrets, tokens, internal URLs, private endpoints, or environment-specific values).

## Output format:
- Group related changes under headings using \`##\` (e.g. "New Features", "Bug Fixes", "Improvements", "Breaking Changes"), and list individual changes as bullet points.
- For breaking changes, use a separate section and explain how users should adapt.
- Output ONLY the release note content — no preamble, title, commentary, or "Here is...". Do not wrap it in a top-level "Release Note" title.
- Do not use \`---\` separators; use \`##\` headings instead.
`
}

export function buildMarkdownCommitsList(commits: GitCommitInfo[]) {
  return commits
    .map((c) =>
      [
        `- Commithash: ${c.hash}`,
        `  - > ${c.message.replaceAll('\n', '\n    > ')}`,
        `  - Timestamp: ${c.date}`,
        `  - Author: ${c.author_name} <${c.author_email}>`,
      ].join('\n')
    )
    .join('\n\n')
}
