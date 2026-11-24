import {
  getThemePreference,
  setThemePreference
} from '@/src/theme/theme-preference';
import { captureException, startSpan } from '@sentry/react-native';
import { getInfoAsync } from 'expo-file-system';
import { getPermissionsAsync } from 'expo-notifications';
import { getSdkStatus } from 'react-native-health-connect';

// Catches a native module that stops loading under Jest through jest-expo defaults
// or its shared mock in tests/mocks.
test('native modules load and answer one call each', async () => {
  setThemePreference('dark');
  expect(getThemePreference()).toBe('dark');

  await expect(getSdkStatus()).resolves.toEqual(expect.any(Number));

  // jest-expo's default expo-file-system mock exposes the legacy functions only;
  // File and Paths are absent under Jest.
  await expect(getInfoAsync('file:///probe')).resolves.toEqual(
    expect.objectContaining({ exists: true })
  );

  await expect(getPermissionsAsync()).resolves.toEqual(
    expect.objectContaining({ status: expect.any(String) })
  );

  expect(startSpan({ name: 'compat probe' }, () => 'span result')).toBe(
    'span result'
  );
  expect(() => captureException(new Error('compat probe'))).not.toThrow();
});
