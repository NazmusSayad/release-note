import { Provider } from 'ai'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import z from 'zod'
import { generateConfigSchema, providerOptionsSchema } from './config-schema.js'

const CONFIG_PATHS = [
  'release-note.json',
  'release-note.jsonc',
  '.github/release-note.json',
  '.github/release-note.jsonc',
]

export async function resolveConfig(
  cwd: string,
  configPaths: string[] = CONFIG_PATHS
) {
  for (const configPath of configPaths) {
    const fullPath = path.join(cwd, configPath)

    if (fs.existsSync(fullPath)) {
      console.log(chalk.green(`Using config file: ${fullPath}`))

      try {
        const configContent = await fs.promises.readFile(fullPath, 'utf8')
        return generateConfigSchema.parse(JSON.parse(configContent))
      } catch {
        console.error(chalk.red(`Error parsing config file: ${fullPath}`))
        throw new Error(`Invalid config file: ${fullPath}`)
      }
    }
  }

  return generateConfigSchema.parse({})
}

const PROVIDERS_FACTORY: Record<string, { create: string }> = {
  '@ai-sdk/openai': { create: 'createOpenAI' },
  '@ai-sdk/anthropic': { create: 'createAnthropic' },
  '@openrouter/ai-sdk-provider': { create: 'createOpenRouter' },
}

function resolveApiKey(
  vars: string | string[] | undefined
): string | undefined {
  let resolvedApiKey: string | undefined

  const apiKeyEnvVars = typeof vars === 'string' ? [vars] : (vars ?? [])

  for (const envVar of apiKeyEnvVars) {
    resolvedApiKey = process.env[envVar]
    break
  }

  return resolvedApiKey
}

export async function resolveProvider(
  name: string,
  options: z.infer<typeof providerOptionsSchema>
): Promise<Provider['languageModel'] | null> {
  const resolvedApiKey = resolveApiKey(options.apiKeyEnv)

  if (name === '@ai-sdk/openai-compatible') {
    if (!options.apiUrl) {
      throw new Error('""apiUrl"" is required for openai-compatible provider')
    }

    if (!resolvedApiKey) {
      throw new Error('No API key found in the specified environment variables')
    }

    const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible')
    return createOpenAICompatible({
      name,
      apiKey: resolvedApiKey,
      baseURL: options?.apiUrl,
      headers: options?.headers,
      ...options?.options,
    })
  }

  const provider = PROVIDERS_FACTORY[name]
  if (provider) {
    const mod = await import(name)
    return mod[provider.create]({
      apiKey: resolvedApiKey,
      baseURL: options?.apiUrl,
      headers: options?.headers,
      ...options?.options,
    })
  }

  return null
}
