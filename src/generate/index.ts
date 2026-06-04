import { generateConfigSchema } from '@/generate/config-schema.js'
import { importNpm } from '@/lib/import-npm.js'
import z from 'zod'

export async function generateReleaseNote(
  cwd: string,
  options: z.infer<typeof generateConfigSchema>
): Promise<string> {
  const lodash = await importNpm('lodash')
  return lodash.default.camelCase('hello world')
}
