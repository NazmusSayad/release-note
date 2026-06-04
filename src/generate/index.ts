import { generateConfigSchema } from '@/config/config-schema.js'
import { SYSTEM_PROMPT } from '@/constants/prompts.js'
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
    system: SYSTEM_PROMPT,
    prompt: 'DO IT',
  })

  return response.text
}
