import { SUPPORTED_PROVIDERS } from '@/constants/providers.js'
import { z } from 'zod'

const commitSchema = z.object({ commit: z.string() })

const tagSchema = z.object({
  tag: z.string().or(z.instanceof(RegExp)),
  offset: z.number().int().min(0).optional(),
})

export const gitCommitTargetSchema = z.union([
  tagSchema,

  z.object({
    prev: z.union([tagSchema, commitSchema]),
    current: z.union([tagSchema, commitSchema]),
  }),
])

export const providerPackageSchema = z.union([
  z.enum(
    Object.keys(SUPPORTED_PROVIDERS) as (keyof typeof SUPPORTED_PROVIDERS)[]
  ),

  z.object({
    npm: z.string(),
    import: z.string(),
  }),
])

export const providerOptionsSchema = z.object({
  apiUrl: z.string().optional(),
  apiKeyEnv: z.union([z.string(), z.array(z.string())]).optional(),

  provider: providerPackageSchema.default('@ai-sdk/openai-compatible'),
  headers: z.record(z.string(), z.string()).optional(),
  options: z.record(z.string(), z.unknown()).optional(),
})

export const generateConfigSchema = providerOptionsSchema.extend({
  target: gitCommitTargetSchema.default({ tag: '.*' }),

  model: z.string().min(1),
  temperature: z.number().min(0).max(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().optional(),

  timeout: z.number().int().min(0).optional(),
  maxRetries: z.number().int().min(0).optional(),
  maxOutputTokens: z.number().int().min(1).optional(),

  toolChoice: z.enum(['auto', 'none', 'required']).optional(),
  steps: z.number().int().min(5).max(500).optional(),

  instructions: z.string().optional(),
})
