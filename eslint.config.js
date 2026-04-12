const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      'node_modules/*',
      'ios/*',
      'android/*',
      'bin/*',
      'build/*',
      'expo-env.d.ts',
      'nativewind-env.d.ts',
      'pnpm-lock.yaml',
      '.expo/*'
    ]
  },
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'unused-imports': unusedImports
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native-safe-area-context',
              importNames: ['SafeAreaView'],
              message:
                'Use SafeAreaView from @/src/components/ui/safe-area-view to avoid jumpy React Navigation layouts.'
            }
          ]
        }
      ],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }]
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error'
    }
  }
]);
