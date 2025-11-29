import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/jsx/jsx-runtime.ts',
    'src/jsx/jsx-dev-runtime.ts',
    'src/layout/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['@escp/core'],
});
