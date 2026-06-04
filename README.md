# release-note

AI-powered release note generator. Reads your git history between two refs, then asks an LLM to draft user-facing release notes — with the ability to inspect diffs and browse the tree at any commit for accurate, grounded output.

Works as a CLI or as a programmatic library.

## Features

- **Git-aware**: pick a range by tag regex (e.g. `v.*`) or explicit commit hash.
- **Agentic**: the model can call `check_diff` and `browse_code` tools to look up the actual changes before writing.
- **Multi-provider**: ships support for OpenAI, Anthropic, Google, xAI, Azure, Bedrock, Groq, Mistral, DeepSeek, Cohere, Fireworks, Perplexity, OpenRouter, TogetherAI, DeepInfra, Cerebras, Fal, Luma, Baseten, Vertex, and any OpenAI-compatible endpoint.
- **Configurable**: JSON / JSONC config file, CLI flags, or full programmatic control.
- **Audience-tuned prompts**: output is written for end users and PMs, not engineers. Internal identifiers, file paths, and implementation details are filtered out automatically.

## Installation

```bash
pnpm add release-note
# or
npm install release-note
# or
yarn add release-note
```

If you plan to use OpenRouter, also install its peer dependency:

```bash
pnpm add @openrouter/ai-sdk-provider
```

For other providers, the corresponding `@ai-sdk/*` package is required at runtime and is **not** bundled with `release-note`.

## CLI

```bash
release-note generate [options]
```

Options:

| Flag        | Description                                     |
| ----------- | ----------------------------------------------- |
| `--cwd`     | Working directory (defaults to `process.cwd()`) |
| `--config`  | Path to a config file                           |
| `--outFile` | Write the result to a file instead of stdout    |

Examples:

```bash
# Print to stdout
release-note generate

# Use a specific config
release-note generate --config ./configs/release.json

# Save the result to a file
release-note generate --outFile RELEASE_NOTES.md
```

## Programmatic API

```ts
import releaseNote from 'release-note'

const { note, commits, provider } = await releaseNote(process.cwd(), {
  model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  provider: '@openrouter/ai-sdk-provider',
  match: { tag: 'v.*' },
})

console.log(note)
```

The `releaseNote` named export is also available:

```ts
import { releaseNote } from 'release-note'
```

### Return value

| Field      | Type              | Description                           |
| ---------- | ----------------- | ------------------------------------- |
| `note`     | `string`          | The generated release note text       |
| `commits`  | `GitCommitInfo[]` | The commits included in the range     |
| `provider` | `object`          | Raw provider response and token usage |

### `GitCommitInfo`

```ts
type GitCommitInfo = {
  hash: string
  date: string
  message: string
  author_name: string
  author_email: string
}
```

## Configuration

`release-note` looks for the first existing file in this order:

1. `release-note.json`
2. `release-note.jsonc`
3. `.github/release-note.json`
4. `.github/release-note.jsonc`

Use `--config <path>` to point at a different file. JSONC (with comments and trailing commas) is supported.

### Schema

```ts
{
  // Commit range. Either a tag regex or an explicit commit.
  // Default: { tag: '.*' }
  match: { tag: string } | { commit: string }

  // Model identifier. Required.
  model: string

  // Optional cap on agent steps. Defaults to (commits + 1) * 2.
  steps?: number

  // Provider package. Default: '@ai-sdk/openai-compatible'
  provider: '@ai-sdk/openai'
          | '@ai-sdk/openai-compatible'
          | '@ai-sdk/anthropic'
          | '@ai-sdk/google'
          | '@ai-sdk/xai'
          | '@ai-sdk/azure'
          | '@ai-sdk/amazon-bedrock'
          | '@ai-sdk/groq'
          | '@ai-sdk/fal'
          | '@ai-sdk/deepinfra'
          | '@ai-sdk/google-vertex'
          | '@ai-sdk/mistral'
          | '@ai-sdk/togetherai'
          | '@ai-sdk/cohere'
          | '@ai-sdk/fireworks'
          | '@ai-sdk/deepseek'
          | '@ai-sdk/cerebras'
          | '@ai-sdk/perplexity'
          | '@ai-sdk/luma'
          | '@ai-sdk/baseten'
          | '@openrouter/ai-sdk-provider'

  // Required when provider is '@ai-sdk/openai-compatible'.
  apiUrl?: string

  // Environment variable name(s) holding the API key.
  // If an array is given, only the first entry is consulted.
  apiKeyEnv?: string | string[]

  // Extra HTTP headers for the provider.
  headers?: Record<string, string>

  // Extra provider options (passed through to the provider factory).
  options?: Record<string, unknown>
}
```

### Example: OpenRouter

`release-note.json`

```json
{
  "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "provider": "@openrouter/ai-sdk-provider",
  "apiKeyEnv": "OPENROUTER_API_KEY",
  "match": { "tag": "v.*" }
}
```

### Example: OpenAI-compatible endpoint (LM Studio, vLLM, etc.)

`release-note.json`

```json
{
  "model": "local-model",
  "provider": "@ai-sdk/openai-compatible",
  "apiUrl": "http://localhost:1234/v1",
  "apiKeyEnv": "LLM_API_KEY",
  "headers": {
    "X-Custom-Header": "value"
  }
}
```

### Example: explicit commit range

```json
{
  "model": "gpt-4o",
  "provider": "@ai-sdk/openai",
  "apiKeyEnv": "OPENAI_API_KEY",
  "match": { "commit": "HEAD" }
}
```

> With `match.tag`, the most recent matching tag becomes the upper bound and the next-most-recent becomes the lower bound. With `match.commit`, both bounds resolve to the same hash, so the log covers that single commit.

## How it works

1. Resolves the commit range from `match` (latest and previous matching tags, or an explicit commit).
2. Collects the commits in that range via `simple-git`.
3. Sends the commit list to the configured model, along with two tools:
   - `check_diff(commithash)` — returns the full patch for a commit.
   - `browse_code(commithash, path)` — returns the file content or folder listing at a path within a commit.
4. The model may call these tools to gather context, then produces the final release note.
5. Returns the text (and writes it to `--outFile` if provided).

The system prompt enforces:

- No top-level title wrapping the content as "Release Note".
- Section headings via `##`, not `---` separators.
- Grouped sections such as **New Features**, **Bug Fixes**, **Improvements**, **Breaking Changes**.
- No internal identifiers (paths, class/function names, env keys, etc.) and no secrets.
- Trivial changes (formatting, refactors, dependency bumps with no user impact) are skipped.

## Requirements

- Node.js 18+ (ES modules).
- A git repository to read history from.
- An API key for whichever provider you configure.

## Development

```bash
pnpm install
pnpm dev          # build in watch mode + typecheck
pnpm build        # produce dist/
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint .
pnpm lint:fix     # eslint . --fix
```

The build is driven by [tsdown](https://github.com/rolldown/tsdown) and emits ESM into `dist/`.

## License

No license has been declared in `package.json` yet. Add a `LICENSE` file and a `license` field in `package.json` before publishing.
