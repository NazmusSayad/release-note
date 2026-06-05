import generateReleaseNote from './index.js'

void (async () => {
  const { note, commits } = await generateReleaseNote(process.cwd(), {
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: '@openrouter/ai-sdk-provider',
    target: {
      prev: { offset: 1, tag: RegExp(/^v\d+\.\d+\.\d+$/) },
      current: { offset: 0, tag: RegExp(/^v\d+\.\d+\.\d+$/) },
    },
    logger: console.log,
  })

  console.log(commits)
  console.log(note)
})()
