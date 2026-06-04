import { z } from 'zod'

export const configSchema = z.object({
  current: z.string().optional(),
  from: z.string().optional(),
})
