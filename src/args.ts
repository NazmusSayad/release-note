import { Command } from '@commander-js/extra-typings'

export const program = new Command('app')

program
  .command('generate')
  .description('Generate release notes between two versions')
  .requiredOption('--current <string>', 'Current version tag (e.g., v1.2.3)')
  .requiredOption('--from <string>', 'Starting version tag (e.g., v1.0.0)')
  .action((options) => {
    console.log('Generating release notes...')
    console.log('Current:', options.current)
    console.log('From:', options.from)
  })
