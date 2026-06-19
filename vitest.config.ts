import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Standalone Vitest config (does NOT load the TanStack Router plugin — tests don't
// need route-tree codegen). Mirrors the `@` alias from vite.config.ts.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    env: {
      VITE_BASE_API_URL: 'http://localhost:8080/api/v1',
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/routeTree.gen.ts',
        'src/main.tsx',
        'src/test/**',
        'src/components/ui/**',
      ],
      // Regression floor below current levels (functions is low ~47% — many untested
      // aux pages/components). Raise as coverage grows; keep under the actual numbers
      // so CI stays green. Enforced via `test:coverage`.
      thresholds: {
        statements: 64,
        branches: 70,
        functions: 42,
        lines: 64,
      },
    },
  },
});
