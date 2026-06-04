import { releaseNote } from './index.js'
void (async () => {
  const { note } = await releaseNote(process.cwd(), {
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: '@openrouter/ai-sdk-provider',
    current: { tag: 'v.*' },
    prev: { tag: 'v.*' },
  })

  console.log(note)
})()
