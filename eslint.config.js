import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // Generated shadcn/ui primitives and the app entry point: the fast-refresh
    // "only export components" rule and the skeleton's Math.random width don't
    // apply meaningfully here.
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/main.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/purity': 'off',
    },
  },
])
