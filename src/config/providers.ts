export const SUPPORTED_PROVIDERS = {
  '@ai-sdk/openai': { create: 'createOpenAI' },
  '@ai-sdk/anthropic': { create: 'createAnthropic' },
  '@openrouter/ai-sdk-provider': { create: 'createOpenRouter' },
} as const satisfies Record<string, { create: string }>
