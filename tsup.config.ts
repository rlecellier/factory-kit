import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  outDir: 'dist',
  clean: true,
  format: ['esm', 'cjs'],
  target: ['es2022', 'node18'],
  dts: true,
  minify: true,
  sourcemap: false,
  splitting: true,
  esbuildOptions(options) {
    options.alias = {
      '@': './src',
    };
    options.ignoreAnnotations = true;
    options.outExtension = { '.js': '.js' };
  },
});
