import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

mock.module('react-native', {
  namedExports: { Platform: { OS: 'android' } }
});

mock.module('expo', {
  namedExports: {
    requireOptionalNativeModule: () => ({
      getAccess: () => ({ supported: true, granted: false }),
      openSettings: () => undefined
    })
  }
});

const exactAlarmPromise =
  import('@/src/features/rest-timer/rest-timer-exact-alarm');

test('older native module falls back when channel settings are unavailable', async () => {
  const exactAlarm = await exactAlarmPromise;

  assert.deepEqual(exactAlarm.getExactAlarmAccess(), {
    supported: true,
    granted: false
  });
  assert.equal(exactAlarm.openRestTimerNotificationChannelSettings(), false);
});
