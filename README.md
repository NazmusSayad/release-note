# release-note

AI-powered release note generator. Point it at a git repository and it automatically drafts user-facing release notes for you — no more writing them by hand.

Works as a CLI or a programmatic library.

## Installation

```bash
pnpm add release-note
# or
npm install release-note
# or
yarn add release-note
```

Depending on which LLM provider you use, you may need to install an additional package. For example, if you use OpenRouter:

```bash
pnpm add @openrouter/ai-sdk-provider
```

Other providers each have a corresponding `@ai-sdk/*` package. See the configuration section below for the full list.

## Quick start

1. Create a `release-note.json` in your project root:

   ```json
   {
     "model": "gpt-4o",
     "provider": "@ai-sdk/openai",
     "apiKeyEnv": "OPENAI_API_KEY",
     "match": { "tag": "v.*" }
   }
   ```

2. Set your API key as an environment variable (`OPENAI_API_KEY` in this example).

3. Run:

   ```bash
   release-note generate
   ```

The tool finds the latest two tags matching `v.*`, collects all commits between them, and generates a release note to stdout.

## CLI

```bash
release-note generate [options]
```

| Flag        | Description                                       |
| ----------- | ------------------------------------------------- |
| `--cwd`     | Working directory (defaults to current directory) |
| `--config`  | Path to a config file                             |
| `--outFile` | Write the result to a file instead of stdout      |

```bash
# Save to a file
release-note generate --outFile RELEASE_NOTES.md

# Use a specific config file
release-note generate --config ./configs/release.json
```

## Configuration

Place a `release-note.json` or `release-note.jsonc` file in your project root (or in `.github/`). JSONC allows comments and trailing commas. Use `--config <path>` to use a different file.

### Schema

| Field       | Required | Description                                                  |
| ----------- | -------- | ------------------------------------------------------------ |
| `model`     | Yes      | Model identifier (e.g. `gpt-4o`, `claude-sonnet-4-20250514`) |
| `provider`  | No       | Provider package (default: `@ai-sdk/openai-compatible`)      |
| `apiKeyEnv` | No       | Environment variable name holding the API key                |
| `apiUrl`    | No       | Base URL (required for `@ai-sdk/openai-compatible`)          |
| `match`     | No       | Commit range to scan (default: `{ "tag": ".*" }`)            |
| `steps`     | No       | Cap on LLM reasoning steps (auto-calculated if omitted)      |
| `headers`   | No       | Extra HTTP headers for the provider                          |
| `options`   | No       | Extra options passed to the provider factory                 |

**Supported providers:** `@ai-sdk/openai`, `@ai-sdk/openai-compatible`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/xai`, `@ai-sdk/azure`, `@ai-sdk/amazon-bedrock`, `@ai-sdk/groq`, `@ai-sdk/mistral`, `@ai-sdk/deepseek`, `@ai-sdk/cohere`, `@ai-sdk/fireworks`, `@ai-sdk/perplexity`, `@ai-sdk/togetherai`, `@ai-sdk/deepinfra`, `@ai-sdk/cerebras`, `@ai-sdk/fal`, `@ai-sdk/luma`, `@ai-sdk/baseten`, `@ai-sdk/google-vertex`, `@openrouter/ai-sdk-provider`

### Examples

**OpenRouter:**

```json
{
  "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "provider": "@openrouter/ai-sdk-provider",
  "apiKeyEnv": "OPENROUTER_API_KEY",
  "match": { "tag": "v.*" }
}
```

**Local model (LM Studio, vLLM, etc.):**

```json
{
  "model": "local-model",
  "provider": "@ai-sdk/openai-compatible",
  "apiUrl": "http://localhost:1234/v1",
  "apiKeyEnv": "LLM_API_KEY"
}
```

**Single commit:**

```json
{
  "model": "gpt-4o",
  "provider": "@ai-sdk/openai",
  "apiKeyEnv": "OPENAI_API_KEY",
  "match": { "commit": "HEAD" }
}
```

> With `match.tag`, the most recent matching tag is the upper bound and the next-most-recent is the lower bound. With `match.commit`, only that single commit is covered.

## Programmatic API

```ts
import releaseNote from 'release-note'

const { note, commits, provider } = await releaseNote(process.cwd(), {
  model: 'gpt-4o',
  provider: '@ai-sdk/openai',
  apiKeyEnv: 'OPENAI_API_KEY',
  match: { tag: 'v.*' },
})

console.log(note)
```

The default export and the named `releaseNote` export are both available:

```ts
import { releaseNote } from 'release-note'
```

### Return value

| Field      | Type              | Description                           |
| ---------- | ----------------- | ------------------------------------- |
| `note`     | `string`          | The generated release note text       |
| `commits`  | `GitCommitInfo[]` | The commits included in the range     |
| `provider` | `object`          | Raw provider response and token usage |

**`GitCommitInfo`:**

```ts
type GitCommitInfo = {
  hash: string
  date: string
  message: string
  author_name: string
  author_email: string
}
```

## Output style

Generated release notes are written for end users and product managers, not engineers:

- **Grouped by category** — New Features, Bug Fixes, Improvements, Breaking Changes
- **No internal identifiers** — file paths, class names, function names, env keys are filtered out
- **No trivial changes** — formatting-only commits, refactors, and dependency bumps with no user impact are skipped
- **Clean markdown** — section headings via `##`, no top-level title wrapping

## Requirements

- Node.js 18+
- A git repository
- An API key for your chosen LLM provider

## License

[MIT](LICENSE)
