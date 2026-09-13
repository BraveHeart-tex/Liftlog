import type { DrizzleDb } from '@/src/db/client';
import type { LiftLogBackupV2 } from '@/src/features/backup/backup.types';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

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

mock.module('expo-constants', {
  namedExports: { default: { expoConfig: { version: '1.0.0' } } }
});
mock.module('expo-file-system', {
  namedExports: {
    File: class {},
    Paths: {
      cache: { uri: 'cache:' },
      document: { uri: 'document:' }
    }
  }
});
mock.module('expo-file-system/legacy', {
  namedExports: {
    deleteAsync: async () => undefined,
    moveAsync: async () => undefined,
    writeAsStringAsync: async () => undefined
  }
});
mock.module('expo-sharing', {
  namedExports: {
    isAvailableAsync: async () => true,
    shareAsync: async () => undefined
  }
});
mock.module('@/src/features/backup/backup.repository', {
  namedExports: {
    createBackupSnapshot: () => backup,
    replaceBackupData: () => {
      events.push('replace-data');
    }
  }
});
mock.module('@/src/features/rest-timer/rest-timer-notifications.service', {
  namedExports: {
    cancelRestTimerNotification: async () => {
      events.push('cancel-notification');
    }
  }
});
mock.module('@/src/features/rest-timer/rest-timer.store', {
  namedExports: {
    useRestTimerStore: {
      getState: () => ({
        cancel: () => {
          events.push('cancel-timer');
        }
      })
    }
  }
});
mock.module('@/src/lib/db/live-query-refresh', {
  namedExports: {
    refreshLiveQueries: () => {
      events.push('refresh');
    }
  }
});
mock.module('@/src/theme/theme-preference', {
  namedExports: {
    getThemePreference: () => 'system',
    setThemePreference: () => {
      events.push('set-theme');
    }
  }
});

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
