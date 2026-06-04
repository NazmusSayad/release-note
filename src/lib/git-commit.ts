import { gitCommitTargetSchema } from '@/config/config-schema.js'
import z from 'zod'

export async function resolveGitCommitHash(
  cwd: string,
  target: z.infer<typeof gitCommitTargetSchema>
): Promise<string | null> {}
