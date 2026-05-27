import { useDrizzle } from '@/src/components/database-provider';
import type { HealthStepDay } from '@/src/db/schema';
import {
  getRecentStepDaysQuery,
  upsertStepDays
} from '@/src/features/steps/repository';
import {
  getHealthConnectAvailability,
  getStepPermissionState,
  openStepHealthConnectSettings,
  requestStepPermissions,
  syncStepDaysFromHealthConnect,
  type HealthConnectAvailability,
  type StepPermissionState
} from '@/src/features/steps/health-connect';
import {
  refreshStepNotification,
  showStepNotification
} from '@/src/features/steps/notifications';
import {
  getMillisecondsUntilNextLocalDay,
  getTodayDateKey
} from '@/src/features/steps/date';
import { SETTINGS_KEYS, setSetting } from '@/src/features/settings/repository';
import { useSettings } from '@/src/features/settings/hooks';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveStepCounter } from './use-live-step-counter';

type SyncState = 'idle' | 'syncing';

interface StepStats {
  average7DaySteps: number;
  bestDay: HealthStepDay | null;
  todaySteps: number;
}

const RECENT_DAY_LIMIT = 31;

const EMPTY_PERMISSION_STATE: StepPermissionState = {
  canReadSteps: false,
  canReadBackground: false,
  canReadHistory: false
};

function getStats(days: HealthStepDay[], todayDateKey: string): StepStats {
  const newestFirstDays = [...days].sort((a, b) => b.startAt - a.startAt);
  const oldestFirstDays = [...days].sort((a, b) => a.startAt - b.startAt);
  const todaySteps = days.find(day => day.dateKey === todayDateKey)?.steps ?? 0;
  const last7Days = newestFirstDays.slice(0, 7);
  const average7DaySteps =
    last7Days.length === 0
      ? 0
      : Math.round(
          last7Days.reduce((total, day) => total + day.steps, 0) /
            last7Days.length
        );
  const bestDay =
    oldestFirstDays.reduce<HealthStepDay | null>((best, day) => {
      if (!best || day.steps > best.steps) {
        return day;
      }

      return best;
    }, null) ?? null;

  return {
    average7DaySteps,
    bestDay,
    todaySteps
  };
}

export function useStepsScreen() {
  const db = useDrizzle();
  const {
    healthConnectStepsEnabled,
    stepsNotificationEnabled,
    stepGoal,
    setHealthConnectStepsEnabled
  } = useSettings();
  const stepDaysResult = useLiveWithFallback(
    getRecentStepDaysQuery(db, RECENT_DAY_LIMIT),
    [db]
  );
  const stepDays = useMemo(
    () => [...stepDaysResult.data].sort((a, b) => a.startAt - b.startAt),
    [stepDaysResult.data]
  );
  const [todayDateKey, setTodayDateKey] = useState(getTodayDateKey);
  const stats = useMemo(
    () => getStats(stepDays, todayDateKey),
    [stepDays, todayDateKey]
  );
  const [availability, setAvailability] =
    useState<HealthConnectAvailability>('unavailable');
  const [permissions, setPermissions] = useState<StepPermissionState>(
    EMPTY_PERMISSION_STATE
  );
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const liveStepCounter = useLiveStepCounter({
    availability,
    baselineDateKey: todayDateKey,
    baselineSteps: stats.todaySteps,
    canReadHealthConnectSteps: permissions.canReadSteps,
    isEnabled: healthConnectStepsEnabled && stepsNotificationEnabled,
    stepGoal
  });
  const displayedTodaySteps = Math.max(
    stats.todaySteps,
    liveStepCounter.steps ?? stats.todaySteps
  );
  const liveStepDelta = Math.max(0, displayedTodaySteps - stats.todaySteps);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTodayDateKey(getTodayDateKey());
    }, getMillisecondsUntilNextLocalDay());

    return () => clearTimeout(timeoutId);
  }, [todayDateKey]);

  const refreshStatus = useCallback(async () => {
    try {
      const nextAvailability = await getHealthConnectAvailability();

      setAvailability(nextAvailability);

      if (nextAvailability !== 'available') {
        setPermissions(EMPTY_PERMISSION_STATE);

        return EMPTY_PERMISSION_STATE;
      }

      const nextPermissions = await getStepPermissionState();

      setPermissions(nextPermissions);

      return nextPermissions;
    } finally {
      setHasCheckedAvailability(true);
    }
  }, []);

  const syncSteps = useCallback(
    async ({ isInitial }: { isInitial: boolean }) => {
      setErrorMessage(null);
      setSyncState('syncing');

      try {
        const nextPermissions = await refreshStatus();

        if (!nextPermissions.canReadSteps) {
          return;
        }

        const result = await syncStepDaysFromHealthConnect({ isInitial });

        if (result.days.length === 0) {
          return;
        }

        upsertStepDays(db, result.days);
        setSetting(db, SETTINGS_KEYS.stepsLastSyncAt, String(Date.now()));

        const today = result.days.at(-1);

        if (stepsNotificationEnabled && today) {
          await showStepNotification({
            steps: today.steps ?? 0,
            goal: stepGoal
          });
        }
      } catch (error) {
        console.error('Failed to sync steps', error);
        setErrorMessage('Could not sync steps from Health Connect.');
      } finally {
        setSyncState('idle');
      }
    },
    [db, refreshStatus, stepGoal, stepsNotificationEnabled]
  );

  const connectSteps = useCallback(async () => {
    setErrorMessage(null);
    setSyncState('syncing');

    try {
      const nextPermissions = await requestStepPermissions();

      setPermissions(nextPermissions);

      if (!nextPermissions.canReadSteps) {
        setHealthConnectStepsEnabled(false);

        return;
      }

      setHealthConnectStepsEnabled(true);
      await syncSteps({ isInitial: true });
    } catch (error) {
      console.error('Failed to connect Health Connect steps', error);
      setErrorMessage('Could not connect to Health Connect.');
    } finally {
      setSyncState('idle');
    }
  }, [setHealthConnectStepsEnabled, syncSteps]);

  const refreshSteps = useCallback(async () => {
    await syncSteps({ isInitial: false });

    if (stepsNotificationEnabled) {
      await refreshStepNotification(stepGoal);
    }
  }, [stepGoal, stepsNotificationEnabled, syncSteps]);

  useFocusEffect(
    useCallback(() => {
      setTodayDateKey(getTodayDateKey());
      void refreshStatus();

      if (healthConnectStepsEnabled) {
        void syncSteps({ isInitial: false });
      }
    }, [healthConnectStepsEnabled, refreshStatus, syncSteps])
  );

  return {
    availability,
    errorMessage,
    healthConnectStepsEnabled,
    isLoading: !stepDaysResult.isLive || !hasCheckedAvailability,
    isSyncing: syncState === 'syncing',
    displayedTodaySteps,
    liveStepCounterError: liveStepCounter.error,
    liveStepCounterStatus: liveStepCounter.status,
    liveStepDelta,
    permissions,
    stats,
    stepDays,
    stepGoal,
    connectSteps,
    openHealthConnectSettings: openStepHealthConnectSettings,
    refreshSteps
  };
}
