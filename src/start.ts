import generateReleaseNote from './index.js'

void (async () => {
  const { note } = await generateReleaseNote(process.cwd(), {
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: '@openrouter/ai-sdk-provider',
    match: { tag: 'v.*' },
    logger: console.log,
  })

  console.log(note)
})()
