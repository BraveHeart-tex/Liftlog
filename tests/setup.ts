import { mock } from 'node:test';

if (
  process.argv.every(
    argument => !argument.includes('database-observability.test.ts')
  )
) {
  mock.module('@sentry/react-native', {
    namedExports: {
      startSpan<T>(
        _options: unknown,
        callback: (span: { setStatus: () => void }) => T
      ): T {
        return callback({ setStatus: () => undefined });
      }
    }
  });
}
