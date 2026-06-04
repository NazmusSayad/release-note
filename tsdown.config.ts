import { defineConfig, type Format } from 'tsdown'
import packageJSON from './package.json' with { type: 'json' }

export default defineConfig({
  entry: {
    bin: './src/bin.ts',
    index: './src/index.ts',
  },

  outDir: './dist',
  tsconfig: './tsconfig.json',

  target: 'ES2022',
  format: ['esm', 'cjs'] satisfies Format[],

  dts: true,
  clean: true,
  sourcemap: true,

  deps: {
    neverBundle: [
      /node:/gim,
      ...getExternal((packageJSON as any).dependencies),
      ...getExternal((packageJSON as any).peerDependencies),
    ],
  },
})

function getExternal(dependencies: unknown) {
  return Object.keys((dependencies ?? {}) as Record<string, string>).map(
    (dep) => new RegExp(`(^${dep}$)|(^${dep}/)`)
  )
}
