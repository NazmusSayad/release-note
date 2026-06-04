import { z } from 'zod'
import { SUPPORTED_PROVIDERS } from '../constants/providers.js'

export const providerOptionsSchema = z.object({
  apiUrl: z.string().optional(),
  apiKeyEnv: z.union([z.string(), z.array(z.string())]).optional(),

  provider: z
    .enum(Object.keys(SUPPORTED_PROVIDERS))
    .default('@ai-sdk/openai-compatible'),

  headers: z.record(z.string(), z.string()).optional(),
  options: z.record(z.string(), z.unknown()).optional(),
})

export const releaseConfigSchema = z.object({
  current: z.string().default('tag:*'),
  from: z.string().default('tag:*'),
})

export const generateConfigSchema = z
  .object({
    model: z.string(),
  })
  .extend(providerOptionsSchema.shape)
  .extend(releaseConfigSchema.shape)
