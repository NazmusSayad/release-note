import { z } from 'zod'

export const SUPPORTED_PROVIDERS_SCHEMA = z.enum([
  'openai',
  'openai-compatible',
])

export const generateConfigSchema = z.object({
  current: z.string().default('tag:*'),
  from: z.string().default('tag:*'),

  model: z.string().optional(),
  apiUrl: z.string().optional(),
  apiKey: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  provider: SUPPORTED_PROVIDERS_SCHEMA.default('openai-compatible'),
})
