import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import next from '@next/eslint-plugin-next';

export default [
  {
    files: ['smoothr/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser,
      sourceType: 'module',
      ecmaVersion: 2021,
    },
  },
  js.configs.recommended,
  {
    plugins: {
      '@typescript-eslint': ts,
      next,
    },
    rules: {
      ...ts.configs.recommended.rules,
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
