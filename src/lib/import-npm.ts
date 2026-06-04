// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function importNpm<T = any>(packageName: string): Promise<T> {
  const entry = await fetch(`https://esm.sh/${packageName}?bundle`).then((r) =>
    r.text()
  )

  const match = entry.match(/"(\/.*?\.bundle\.mjs)"/)
  if (!match) {
    throw new Error(`Could not resolve ${packageName}`)
  }

  const code = await fetch(`https://esm.sh${match[1]}`).then((r) => r.text())
  const url = 'data:text/javascript;base64,' + btoa(code)

  return import(url)
}
