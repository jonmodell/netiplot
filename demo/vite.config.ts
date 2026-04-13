import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Point directly at source so hot-reload works during development
      '@jonmodell/netiplot/vanilla': resolve(__dirname, '../src/vanilla/NetiPlot.ts'),
      '@jonmodell/netiplot': resolve(__dirname, '../src/index.ts'),
    },
  },
});
