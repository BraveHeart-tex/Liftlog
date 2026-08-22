import stylistic from '@stylistic/eslint-plugin';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import expoConfig from 'eslint-config-expo/flat.js';
import unusedImports from 'eslint-plugin-unused-imports';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      'node_modules/*',
      'ios/*',
      'android/*',
      'bin/*',
      'build/*',
      'src/db/migrations/**',
      'expo-env.d.ts',
      'nativewind-env.d.ts',
      'pnpm-lock.yaml',
      '.expo/*',
      '.agents/*'
    ]
  },
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'unused-imports': unusedImports,
      '@stylistic': stylistic
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
                'Use NativeWind safe-area utilities for static safe-area spacing. Use useSafeAreaInsets only for numeric calculations.'
            },
            {
              name: 'react-native',
              importNames: ['InteractionManager'],
              message:
                'InteractionManager is deprecated. Use scheduleIdleTask instead.'
            }
          ],
          patterns: [
            {
              regex: '^\\.',
              message: 'Use an absolute import with the @/ alias instead.'
            }
          ]
        }
      ],
      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          next: [
            'export',
            'return',
            'try',
            'if',
            'throw',
            'for',
            'while',
            'switch',
            'function'
          ],
          prev: '*'
        },
        {
          blankLine: 'always',
          next: '*',
          prev: [
            'try',
            'if',
            'directive',
            'block',
            'block-like',
            'for',
            'while',
            'switch',
            'function'
          ]
        }
      ],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportNamespaceSpecifier',
          message: 'Use named imports instead of namespace imports.'
        }
      ]
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
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native-safe-area-context',
              importNames: ['SafeAreaView'],
              message:
                'Use NativeWind safe-area utilities for static safe-area spacing. Use useSafeAreaInsets only for numeric calculations.'
            },
            {
              name: 'react-native',
              importNames: ['InteractionManager'],
              message:
                'InteractionManager is deprecated. Use scheduleIdleTask instead.'
            }
          ],
          patterns: [
            {
              regex: '^@/src/app(?:/|$)',
              message:
                'Features must not import Expo Router route files. Keep route concerns in src/app.'
            }
          ]
        }
      ]
    }
  },
  {
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/components/styled/**/*.{ts,tsx}',
      'src/lib/**/*.{ts,tsx}',
      'src/theme/**/*.{ts,tsx}'
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native-safe-area-context',
              importNames: ['SafeAreaView'],
              message:
                'Use NativeWind safe-area utilities for static safe-area spacing. Use useSafeAreaInsets only for numeric calculations.'
            },
            {
              name: 'react-native',
              importNames: ['InteractionManager'],
              message:
                'InteractionManager is deprecated. Use scheduleIdleTask instead.'
            }
          ],
          patterns: [
            {
              regex: '^@/src/features(?:/|$)',
              message:
                'Generic shared code must not import feature modules. Move domain composition into the owning feature.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    ignores: [
      '*.config.{js,mjs,ts}',
      'eslint.config.mjs',
      'modules/**',
      'src/app/**',
      'src/db/migrations/**'
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportNamespaceSpecifier',
          message: 'Use named imports instead of namespace imports.'
        },
        {
          selector: 'ExportDefaultDeclaration',
          message:
            'Use named exports. Default exports are reserved for Expo Router screens, layouts, config files, and generated framework files.'
        }
      ]
    }
  }
]);
