import { Command } from '@commander-js/extra-typings'
import { resolveConfig } from './config/resolve-config.js'
import { generateReleaseNote } from './generate/index.js'

export async function createArgs(cwd: string = process.cwd()) {
  const program = new Command('release-note')
  const config = await resolveConfig(cwd)

  program
    .command('generate')
    .description('Generate release notes between two versions')
    .option(
      '--current <string>',
      'Current version tag (e.g., v1.2.3)',
      config.current
    )
    .option(
      '--from <string>',
      'Starting version tag (e.g., v1.0.0)',
      config.from
    )
    .action((options) => {
      void generateReleaseNote(options)
    })

  return program
}
