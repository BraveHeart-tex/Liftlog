import { useDrizzle } from '@/src/providers/database-provider';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { syncAndSaveStepDays } from '@/src/features/steps/steps-sync.service';
import { scheduleIdleTask } from '@/src/lib/utils/schedule-idle-task.utils';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

export function StepsSyncHost() {
  if (Platform.OS !== 'android') {
    return null;
  }

  return <AndroidStepsSyncHost />;
}

function AndroidStepsSyncHost() {
  const db = useDrizzle();
  const { healthConnectStepsEnabled } = useSettings();
  const cancelScheduledSyncRef = useRef<(() => void) | null>(null);
  const scheduleSync = useCallback(() => {
    cancelScheduledSyncRef.current?.();
    cancelScheduledSyncRef.current = scheduleIdleTask(() => {
      cancelScheduledSyncRef.current = null;

      void syncAndSaveStepDays(db, { isInitial: false }).catch(error => {
        console.error('Automatic step sync failed', error);
      });
    });
  }, [db]);

  useEffect(() => {
    if (!healthConnectStepsEnabled) {
      return;
    }

    scheduleSync();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        scheduleSync();
      }
    });

    return () => {
      cancelScheduledSyncRef.current?.();
      cancelScheduledSyncRef.current = null;
      subscription.remove();
    };
  }, [healthConnectStepsEnabled, scheduleSync]);

  return null;
}
