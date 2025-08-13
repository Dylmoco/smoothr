import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import next from '@next/eslint-plugin-next';

export default [
  {
    files: ['smoothr/**/*.{ts,js}'],
    languageOptions: {
      parser,
      sourceType: 'module',
      ecmaVersion: 2021,
      globals: {
        process: 'readonly',
        fetch: 'readonly',
        Buffer: 'readonly',
        NodeJS: 'readonly',
      },
    },
  },
  js.configs.recommended,
  next.flatConfig.recommended,
  {
    settings: {
      next: {
        rootDir: 'smoothr',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...ts.configs.recommended.rules,
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'next/no-html-link-for-pages': 'off',
      'no-undef': 'off',
    },
  },
];
