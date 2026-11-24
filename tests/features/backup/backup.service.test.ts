import type { DrizzleDb } from '@/src/db/client';
import type { LiftLogBackupV2 } from '@/src/features/backup/backup.types';
import assert from 'node:assert/strict';

const events: string[] = [];

const backup: LiftLogBackupV2 = {
  format: 'liftlog-backup',
  schemaVersion: 2,
  createdAt: '2026-09-05T12:00:00.000Z',
  appVersion: '1.0.0',
  data: {
    exercises: [],
    workouts: [],
    workoutExercises: [],
    sets: [],
    workoutTemplates: [],
    workoutTemplateExercises: [],
    settings: {
      weightUnit: 'kg',
      restTimerDuration: 90,
      restTimerPresets: [],
      restTimerNotificationsEnabled: true,
      healthConnectStepsEnabled: false,
      stepGoal: 10000
    },
    themePreference: 'system'
  }
};

jest.doMock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.0.0' } }
}));
jest.doMock('expo-file-system', () => ({
  File: class {},
  Paths: {
    cache: { uri: 'cache:' },
    document: { uri: 'document:' }
  }
}));
jest.doMock('expo-file-system/legacy', () => ({
  deleteAsync: async () => undefined,
  moveAsync: async () => undefined,
  writeAsStringAsync: async () => undefined
}));
jest.doMock('expo-sharing', () => ({
  isAvailableAsync: async () => true,
  shareAsync: async () => undefined
}));
jest.doMock('@/src/features/backup/backup.repository', () => ({
  createBackupSnapshot: () => backup,
  replaceBackupData: () => {
    events.push('replace-data');
  }
}));
jest.doMock(
  '@/src/features/rest-timer/rest-timer-notifications.service',
  () => ({
    cancelRestTimerNotification: async () => {
      events.push('cancel-notification');
    }
  })
);
jest.doMock('@/src/features/rest-timer/rest-timer.store', () => ({
  useRestTimerStore: {
    getState: () => ({
      cancel: () => {
        events.push('cancel-timer');
      }
    })
  }
}));
jest.doMock('@/src/lib/db/live-query-refresh', () => ({
  refreshLiveQueries: () => {
    events.push('refresh');
  }
}));
jest.doMock('@/src/theme/theme-preference', () => ({
  getThemePreference: () => 'system',
  setThemePreference: () => {
    events.push('set-theme');
  }
}));

const servicePromise = import('@/src/features/backup/backup.service');

test('replace-all cancels the active timer before its pending notification', async () => {
  const service = await servicePromise;
  events.length = 0;

  await service.replaceAllWithBackup({} as DrizzleDb, backup, {
    now: new Date('2026-09-05T12:00:00.000Z'),
    filePort: {
      write: async () => {
        events.push('write-safety-backup');
      },
      promote: async () => {
        events.push('promote-safety-backup');
      },
      remove: async () => {
        events.push('remove-temporary-file');
      },
      read: async () => '',
      share: async () => undefined
    },
    cancelTimer: () => events.push('cancel-timer'),
    cancelNotification: async () => {
      events.push('cancel-notification');
    },
    setTheme: () => events.push('set-theme'),
    refreshLiveQueries: () => events.push('refresh')
  });

  assert.deepEqual(events, [
    'write-safety-backup',
    'promote-safety-backup',
    'cancel-timer',
    'cancel-notification',
    'replace-data',
    'set-theme',
    'refresh',
    'remove-temporary-file'
  ]);
});

test('replace-all validates v2 settings before touching timer or safety state', async () => {
  const service = await servicePromise;
  events.length = 0;
  const invalidBackup = {
    ...backup,
    data: {
      ...backup.data,
      settings: {
        ...backup.data.settings,
        restTimerNotificationsEnabled: undefined
      }
    }
  } as unknown as LiftLogBackupV2;

  await assert.rejects(
    service.replaceAllWithBackup({} as DrizzleDb, invalidBackup, {
      cancelTimer: () => events.push('cancel-timer')
    })
  );

  assert.deepEqual(events, []);
});
