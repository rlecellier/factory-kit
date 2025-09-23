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
  splitting: false, // Disable splitting for better compatibility
  esbuildOptions(options, { format }) {
    options.alias = {
      '@': './src',
    };
    options.treeShaking = false;
    options.ignoreAnnotations = true;

    // Set proper file extensions based on format
    if (format === 'cjs') {
      options.outExtension = { '.js': '.cjs' };
    } else {
      options.outExtension = { '.js': '.js' };
    }
  },
});
