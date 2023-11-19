import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: false,
  outfile: 'build/index.js',
  platform: "node"
})