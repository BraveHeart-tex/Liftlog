import { useDrizzle } from '@/src/providers/database-provider';
import { showSnackbar } from '@/src/components/ui/snackbar';
import type { HealthStepDay } from '@/src/db/schema';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import {
  getStepHealthConnectStatus,
  openStepHealthConnectSettings,
  requestStepPermissions,
  type HealthConnectAvailability,
  type StepPermissionState
} from '@/src/features/steps/health-connect.service';
import {
  getMillisecondsUntilNextLocalDay,
  getTodayDateKey
} from '@/src/features/steps/steps-date.utils';
import {
  getStepRecentActivityStatus,
  type StepRecentActivityStatus
} from '@/src/features/steps/steps-display.utils';
import { getRecentStepDaysQuery } from '@/src/features/steps/steps.repository';
import { syncAndSaveStepDays } from '@/src/features/steps/steps-sync.service';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SyncState = 'idle' | 'syncing';

interface StepStats {
  recentActivityStatus: StepRecentActivityStatus;
  todaySteps: number;
}

const RECENT_DAY_LIMIT = 31;

const EMPTY_PERMISSION_STATE: StepPermissionState = {
  canReadSteps: false,
  canReadBackground: false,
  canReadHistory: false
};

function getStats(
  days: HealthStepDay[],
  todayDateKey: string,
  stepGoal: number
): StepStats {
  const todaySteps = days.find(day => day.dateKey === todayDateKey)?.steps ?? 0;

  return {
    recentActivityStatus: getStepRecentActivityStatus(days, stepGoal),
    todaySteps
  };
}

export function useStepsScreen() {
  const db = useDrizzle();
  const { healthConnectStepsEnabled, stepGoal, setHealthConnectStepsEnabled } =
    useSettings();
  const stepDaysResult = useLiveWithFallback(
    getRecentStepDaysQuery(db, RECENT_DAY_LIMIT),
    [db],
    {
      deferInitialRead: true,
      waitForInteractions: true,
      operation: 'steps.getRecentStepDays'
    }
  );
  const stepDays = useMemo(
    () => [...stepDaysResult.data].sort((a, b) => b.startAt - a.startAt),
    [stepDaysResult.data]
  );
  const [todayDateKey, setTodayDateKey] = useState(getTodayDateKey);
  const hasStepRecords = stepDays.length > 0;
  const hasTodayStepRecord = stepDays.some(day => day.dateKey === todayDateKey);
  const stats = useMemo(
    () => getStats(stepDays, todayDateKey, stepGoal),
    [stepDays, stepGoal, todayDateKey]
  );
  const [availability, setAvailability] =
    useState<HealthConnectAvailability>('unavailable');
  const [permissions, setPermissions] = useState<StepPermissionState>(
    EMPTY_PERMISSION_STATE
  );
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const displayedTodaySteps = stats.todaySteps;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTodayDateKey(getTodayDateKey());
    }, getMillisecondsUntilNextLocalDay());

    return () => clearTimeout(timeoutId);
  }, [todayDateKey]);

  const refreshStatus = useCallback(async () => {
    try {
      const nextStatus = await getStepHealthConnectStatus();

      if (!isMountedRef.current) {
        return nextStatus.permissions;
      }

      setAvailability(nextStatus.availability);
      setPermissions(nextStatus.permissions);

      return nextStatus.permissions;
    } finally {
      if (isMountedRef.current) {
        setHasCheckedAvailability(true);
      }
    }
  }, []);

  const syncSteps = useCallback(
    async ({ isInitial }: { isInitial: boolean }) => {
      if (isMountedRef.current) {
        setErrorMessage(null);
        setSyncState('syncing');
      }

      try {
        const result = await syncAndSaveStepDays(db, { isInitial });

        if (isMountedRef.current) {
          setAvailability(result.availability);
          setPermissions(result.permissions);
        }
      } catch (error) {
        console.error('Failed to sync steps', error);

        if (isMountedRef.current) {
          setErrorMessage('Could not sync steps from Health Connect.');
        }

        if (!isInitial) {
          showSnackbar({
            message: 'Could not refresh steps from Health Connect.',
            actionLabel: 'Retry',
            onAction: () => syncSteps({ isInitial: false }),
            variant: 'danger'
          });
        }
      } finally {
        if (isMountedRef.current) {
          setSyncState('idle');
        }
      }
    },
    [db]
  );

  const connectSteps = useCallback(async () => {
    setErrorMessage(null);
    setSyncState('syncing');

    try {
      const nextPermissions = await requestStepPermissions();

      if (isMountedRef.current) {
        setPermissions(nextPermissions);
      }

      if (!nextPermissions.canReadSteps) {
        setHealthConnectStepsEnabled(false);

        return;
      }

      setHealthConnectStepsEnabled(true);
      await syncSteps({ isInitial: true });
    } catch (error) {
      console.error('Failed to connect Health Connect steps', error);

      if (isMountedRef.current) {
        setErrorMessage('Could not connect to Health Connect.');
      }

      showSnackbar({
        message: 'Could not connect to Health Connect.',
        actionLabel: 'Retry',
        onAction: connectSteps,
        variant: 'danger'
      });
    } finally {
      if (isMountedRef.current) {
        setSyncState('idle');
      }
    }
  }, [setHealthConnectStepsEnabled, syncSteps]);

  const refreshSteps = useCallback(async () => {
    await syncSteps({ isInitial: false });
  }, [syncSteps]);

  useFocusEffect(
    useCallback(() => {
      setTodayDateKey(getTodayDateKey());
      void refreshStatus();
    }, [refreshStatus])
  );

  return {
    availability,
    errorMessage,
    hasStepRecords,
    hasTodayStepRecord,
    healthConnectStepsEnabled,
    isLoading: !stepDaysResult.isLive || !hasCheckedAvailability,
    isSyncing: syncState === 'syncing',
    displayedTodaySteps,
    permissions,
    stats,
    stepDays,
    stepGoal,
    connectSteps,
    openHealthConnectSettings: openStepHealthConnectSettings,
    refreshSteps
  };
}
