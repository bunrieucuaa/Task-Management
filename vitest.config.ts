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
        // Type-only declarations (interfaces / DTO shapes) — no runtime logic.
        'src/app/entities/**',
        'src/app/repositories/interfaces/**',
        // Codegen-style route registration wrappers (mirror routeTree.gen.ts).
        'src/routes/**',
        // Infra wiring / generated shadcn hook — analogous to main.tsx & components/ui.
        'src/redux/store.ts',
        'src/hooks/use-mobile.ts',
      ],
      // Regression floor a few points below current (~75% stmts/lines, ~61% funcs after
      // adding repository tests + excluding type-only/codegen files). Raise as coverage
      // grows; keep under the actual numbers so CI stays green. Enforced via `test:coverage`.
      thresholds: {
        statements: 72,
        branches: 75,
        functions: 56,
        lines: 72,
      },
    },
  },
});
