import { z } from 'zod'

export const configSchema = z.object({
  current: z.string().default('tag:*'),
  from: z.string().default('tag:*'),
})
