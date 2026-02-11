import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'bin/create-moltbot': 'bin/create-moltbot.ts',
    'server/index': 'server/index.ts',
  },
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  splitting: true,
  clean: false,
  dts: false,
  sourcemap: true,
  outDir: 'dist',
  banner: {
    js: '#!/usr/bin/env node',
  },
});
