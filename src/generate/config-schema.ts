import { z } from 'zod'

export const generateConfigSchema = z.object({
  current: z.string().default('tag:*'),
  from: z.string().default('tag:*'),
})
