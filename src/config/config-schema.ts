import { SUPPORTED_PROVIDERS } from '@/constants/providers.js'
import { z } from 'zod'

export const gitCommitTargetSchema = z.union([
  z.object({ tag: z.string().describe('Git tag regex') }),
  z.object({ commit: z.string().describe('Git commit hash') }),
])

export const providerOptionsSchema = z.object({
  apiUrl: z.string().optional(),
  apiKeyEnv: z.union([z.string(), z.array(z.string())]).optional(),

  provider: z
    .enum(
      Object.keys(SUPPORTED_PROVIDERS) as (keyof typeof SUPPORTED_PROVIDERS)[]
    )
    .default('@ai-sdk/openai-compatible'),

  headers: z.record(z.string(), z.string()).optional(),
  options: z.record(z.string(), z.unknown()).optional(),
})

export const generateConfigSchema = z
  .object({
    match: gitCommitTargetSchema.default({ tag: '.*' }),
    model: z.string().min(1),
    steps: z.number().int().min(5).max(500).optional(),
  })
  .extend(providerOptionsSchema.shape)
