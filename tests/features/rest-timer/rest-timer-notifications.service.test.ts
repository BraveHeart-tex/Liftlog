import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

let permission = { granted: false, canAskAgain: false };
let permissionRequests = 0;
let scheduled: { identifier: string; content: Record<string, unknown> }[] = [];
let presented: { request: (typeof scheduled)[number] }[] = [];
const cancelled: string[] = [];
const dismissed: string[] = [];
const triggers: Record<string, unknown>[] = [];

mock.module('react-native', {
  namedExports: {
    AppState: { currentState: 'active' },
    Linking: { openSettings: async () => undefined },
    Platform: { OS: 'android' }
  }
});

mock.module('expo-notifications', {
  namedExports: {
    AndroidImportance: { HIGH: 4 },
    IosAuthorizationStatus: {},
    SchedulableTriggerInputTypes: { DATE: 'date' },
    cancelScheduledNotificationAsync: async (id: string) => {
      cancelled.push(id);
      scheduled = scheduled.filter(item => item.identifier !== id);
    },
    deleteNotificationChannelAsync: async () => undefined,
    dismissNotificationAsync: async (id: string) => {
      dismissed.push(id);
      presented = presented.filter(item => item.request.identifier !== id);
    },
    getAllScheduledNotificationsAsync: async () => scheduled,
    getPresentedNotificationsAsync: async () => presented,
    getPermissionsAsync: async () => permission,
    requestPermissionsAsync: async () => {
      permissionRequests += 1;

      return permission;
    },
    scheduleNotificationAsync: async (request: {
      identifier: string;
      content: Record<string, unknown>;
      trigger: Record<string, unknown>;
    }) => {
      triggers.push(request.trigger);
      scheduled.push(request);

      return request.identifier;
    },
    setNotificationChannelAsync: async () => undefined,
    setNotificationHandler: () => undefined
  }
});

const servicePromise =
  import('@/src/features/rest-timer/rest-timer-notifications.service');

test('blocked permission does not repeatedly open the system prompt', async () => {
  const service = await servicePromise;

  assert.equal(await service.requestRestTimerNotificationPermission(), false);
  assert.equal(await service.requestRestTimerNotificationPermission(), false);
  assert.equal(permissionRequests, 0);
});

test('replacement keeps one notification and uses the absolute deadline', async () => {
  const service = await servicePromise;

  permission = { granted: true, canAskAgain: true };
  const firstDeadline = Date.now() + 60_000;
  const secondDeadline = firstDeadline + 30_000;

  await service.scheduleRestTimerNotification({
    deadlineEpochMs: firstDeadline,
    context: { exerciseName: 'Squat' }
  });
  presented = [{ request: scheduled[0] }];
  scheduled = [];
  await service.scheduleRestTimerNotification({
    deadlineEpochMs: secondDeadline,
    context: {}
  });

  assert.equal(scheduled.length, 1);
  assert.equal(cancelled.length > 0, true);
  assert.equal(dismissed.length > 0, true);
  assert.deepEqual(triggers.at(-1), {
    type: 'date',
    channelId: 'rest-timer-v2',
    date: new Date(secondDeadline)
  });
});
