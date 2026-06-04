import { Command } from '@commander-js/extra-typings'
import fs from 'fs'
import path from 'path'
import { generateReleaseNote } from './generate/index.js'
import { resolveConfig } from './generate/resolve-config.js'

export async function createArgs() {
  const program = new Command('release-note')

  program
    .command('generate')
    .description('Generate release notes between two versions')
    .option('--cwd [string]', 'Current working directory')
    .option('--config [string]', 'Path to release-note config file')
    .option('--outFile [string]', 'Path to output file (defaults to stdout)')
    .action(async (options) => {
      const resolvedCwd =
        typeof options.cwd === 'string' ? options.cwd : process.cwd()

      const resolvedConfigPath =
        typeof options.config === 'string' ? [options.config] : undefined

      const config = await resolveConfig(resolvedCwd, resolvedConfigPath)
      const result = await generateReleaseNote({ ...config })

      if (typeof options.outFile === 'string') {
        const outPath = path.join(resolvedCwd, options.outFile)
        await fs.promises.writeFile(outPath, result, 'utf8')
        console.log(`Release note written to ${outPath}`)
      } else {
        process.stdout.write(result)
      }
    })

  return program
}
