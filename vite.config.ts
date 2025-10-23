import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AikotoolsPlaceholder',
      fileName: (format) => `aikotools-placeholder.${format === 'es' ? 'mjs' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['luxon', 'xml2js'],
      output: {
        globals: {
          luxon: 'luxon',
          xml2js: 'xml2js',
        },
      },
    },
  },
  plugins: [
    dts({
      include: ['src/**/*'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
    }),
  ],
});
