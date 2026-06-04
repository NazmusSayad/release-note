type CommonProviderOptions = {
  apiKey?: string
  baseURL?: string
  headers?: Record<string, string>
  options?: Record<string, unknown>
}

export async function resolveProvider(
  name: string,
  options: CommonProviderOptions
) {
  if (name === 'openai') {
    const { createOpenAI } = await import('@ai-sdk/openai')
    return createOpenAI({
      apiKey: options?.apiKey,
      baseURL: options?.baseURL,
      headers: options?.headers,
      ...options?.options,
    })
  }
}
