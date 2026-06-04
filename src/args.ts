import { Command } from '@commander-js/extra-typings'
import { generateReleaseNote } from './generate/index.js'

export const program = new Command('app')

program
  .command('generate')
  .description('Generate release notes between two versions')
  .requiredOption('--current <string>', 'Current version tag (e.g., v1.2.3)')
  .requiredOption('--from <string>', 'Starting version tag (e.g., v1.0.0)')
  .action((options) => {
    void generateReleaseNote(options)
  })
