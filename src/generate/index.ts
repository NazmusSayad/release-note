import { generateConfigSchema } from '@/config/config-schema.js'
import * as ai from 'ai'
import z from 'zod'
import { resolveProvider } from '../config/resolve-config.js'

export async function generateReleaseNote(
  cwd: string,
  options: z.infer<typeof generateConfigSchema>
): Promise<string> {
  const provider = await resolveProvider(options.provider, options)

  const response = await ai.generateText({
    model: provider(options.model),
    prompt: 'DO IT',
    system:
      'You are a helpful assistant that generates release notes based on the commit history of a project.',
  })

  return response.text
}
