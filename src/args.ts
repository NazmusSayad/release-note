import { Command } from '@commander-js/extra-typings'
import { generateReleaseNote } from './generate/index.js'

export function createArgs(configFile?: string) {
  const program = new Command('release-note')

  program
    .command('generate')
    .description('Generate release notes between two versions')
    .option('--current <string>', 'Current version tag (e.g., v1.2.3)', 'tag:*')
    .option('--from <string>', 'Starting version tag (e.g., v1.0.0)', 'tag:*')
    .action((options) => {
      void generateReleaseNote(options)
    })

  return program
}
