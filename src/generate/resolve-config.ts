import chalk from 'chalk'
import fs from 'fs'
import { parse } from 'jsonc-parser'
import path from 'path'
import { generateConfigSchema } from './config-schema.js'

const CONFIG_PATHS = [
  'release-note.json',
  'release-note.jsonc',
  '.github/release-note.json',
  '.github/release-note.jsonc',
]

export async function resolveConfig(
  cwd: string,
  configPaths: string[] = CONFIG_PATHS
) {
  for (const configPath of configPaths) {
    const fullPath = path.join(cwd, configPath)

    if (fs.existsSync(fullPath)) {
      console.log(chalk.green(`Using config file: ${fullPath}`))

      try {
        const configContent = await fs.promises.readFile(fullPath, 'utf8')
        return generateConfigSchema.parse(parse(configContent))
      } catch {
        console.error(chalk.red(`Error parsing config file: ${fullPath}`))
        throw new Error(`Invalid config file: ${fullPath}`)
      }
    }
  }

  return generateConfigSchema.parse({})
}
