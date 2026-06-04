import { importNpm } from '@/lib/import-npm.js'

type GenerateInput = {
  current: string
  from: string
}

export async function generateReleaseNote(options: GenerateInput) {
  const lodash = await importNpm('lodash')
  console.log(lodash.default.camelCase('hello world'))
}
