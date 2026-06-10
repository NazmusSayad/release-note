import { GitCommitInfo } from '@/lib/git.js'

export function buildSystemPrompt() {
  return `You generate concise, well-structured, easy-to-read release notes from git commit history.

**Audience**: end users, product managers, and non-technical stakeholders — not engineers.

## Guidelines:
- Focus on user-facing impact: describe WHAT changed and WHY it matters, not HOW it is implemented.
- Use plain language. Avoid technical jargon, library/framework names, and implementation-specific terminology.
- Silently drop changes with no user-visible effect (refactors, renames, formatting, internal tooling, dependency/version bumps) — do not mention them at all, not even as a generic "internal improvements" note.
- NEVER reveal internal details: source code, file names or paths, class/function/variable names, API routes, database tables, config keys, dependency or package names, or any other internal identifier. If a change cannot be described without exposing these, omit it.
- NEVER include sensitive information (credentials, secrets, tokens, internal URLs, private endpoints, or environment-specific values).

## Output format:
- Group related changes under \`##\` headings (e.g. "New Features", "Bug Fixes", "Improvements", "Breaking Changes") with individual changes as bullet points.
- Put breaking changes in their own section and explain how users should adapt.
- Output ONLY the release note content — no preamble, commentary, "Here is...", or top-level "Release Note" title.
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
