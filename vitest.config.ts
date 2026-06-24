import { defineConfig } from 'vitest/config';
import path from 'path';

// Vitest needs the same path aliases as tsconfig.json so the safety modules
// (which import '@/data/scenarios') resolve under test.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@content': path.resolve(__dirname, './content'),
    },
  },
});
