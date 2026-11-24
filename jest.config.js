// Shared mocks for native modules jest-expo does not mock by default.
const moduleNameMapper = {
  '^@sentry/react-native$': '<rootDir>/tests/mocks/sentry-react-native.ts',
  '^expo-notifications$': '<rootDir>/tests/mocks/expo-notifications.ts',
  '^react-native-health-connect$':
    '<rootDir>/tests/mocks/react-native-health-connect.ts',
  '^react-native-nitro-modules$':
    '<rootDir>/tests/mocks/react-native-nitro-modules.ts'
};

// The typography test compiles global.css, which loads nativewind's ESM Tailwind
// plugin, and the dev seed test loads ESM-only @faker-js/faker; the app project
// transforms both alongside the preset's packages.
const appTransformIgnorePatterns =
  require('jest-expo/android/jest-preset').transformIgnorePatterns.map(
    pattern =>
      pattern.replace('(?!(.pnpm|', '(?!(.pnpm|nativewind|@faker-js/faker|')
  );

/** @type {import('jest').Config['projects']} */
const projects = [
  {
    displayName: 'app',
    preset: 'jest-expo/android',
    globalSetup: '<rootDir>/tests/support/time-zone.global-setup.js',
    moduleNameMapper,
    transformIgnorePatterns: appTransformIgnorePatterns,
    testMatch: [
      '<rootDir>/tests/compat/app/**/*.test.{ts,tsx}',
      '<rootDir>/tests/{components,db,features,lib}/**/*.test.{ts,tsx}'
    ]
  },
  {
    displayName: 'native',
    preset: 'jest-expo/android',
    moduleNameMapper,
    testMatch: [
      '<rootDir>/tests/compat/native/**/*.test.{ts,tsx}',
      '<rootDir>/tests/native/**/*.test.ts'
    ]
  },
  {
    displayName: 'tooling',
    preset: 'jest-expo/node',
    // Ticket tooling lives in ESM scripts/*.mjs; transform it like the preset's .js.
    transform: {
      '\\.mjs$': [
        'babel-jest',
        {
          caller: {
            name: 'metro',
            bundler: 'metro',
            platform: 'web',
            isServer: true
          }
        }
      ]
    },
    testMatch: ['<rootDir>/tests/tooling/**/*.test.ts']
  }
];

/** @type {import('jest').Config} */
module.exports = { projects };
