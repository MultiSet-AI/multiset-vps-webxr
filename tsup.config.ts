import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/lib/core/index.ts',
    'webxr/index': 'src/lib/webxr/index.ts'
  },
  clean: true,
  dts: true,
  format: ['esm', 'cjs'],
  splitting: false,
  sourcemap: true,
  target: 'es2019',
  minify: false,
  external: ['three'],
  treeshake: true,
});

