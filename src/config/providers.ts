type ProviderRecord = Record<string, { create: string }>

export const SUPPORTED_PROVIDERS = {
  '@ai-sdk/openai': { create: 'createOpenAI' },
  '@ai-sdk/anthropic': { create: 'createAnthropic' },
  '@openrouter/ai-sdk-provider': { create: 'createOpenRouter' },
} as const satisfies ProviderRecord
