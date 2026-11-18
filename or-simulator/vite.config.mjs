import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'copy-clinical-models',
    async writeBundle({ dir }) {
      await Promise.all([
        cp(resolve('assets'), resolve(dir, 'assets'), { recursive: true }),
        cp(resolve('vendor/rapier'), resolve(dir, 'vendor/rapier'), { recursive: true }),
      ]);
    },
  }],
});
