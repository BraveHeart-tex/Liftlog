import { useDrizzle } from '@/src/components/database-provider';
import { saveStepSyncResult } from '@/src/features/steps/steps.repository';
import { syncStepDaysFromHealthConnect } from '@/src/features/steps/health-connect.service';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export function StepsSyncHost() {
  if (Platform.OS !== 'android') {
    return null;
  }

  return <AndroidStepsSyncHost />;
}

function AndroidStepsSyncHost() {
  const db = useDrizzle();
  const { healthConnectStepsEnabled } = useSettings();
  const didLaunchSyncRef = useRef(false);

  useEffect(() => {
    if (!healthConnectStepsEnabled || didLaunchSyncRef.current) {
      return;
    }

    didLaunchSyncRef.current = true;

    void syncStepDaysFromHealthConnect({ isInitial: false })
      .then(result => {
        const firstDay = result.days[0];

        if (!firstDay) {
          return;
        }

        saveStepSyncResult(db, {
          days: result.days,
          syncedAt: firstDay.syncedAt
        });
      })
      .catch(error => {
        console.error('Launch step sync failed', error);
      });
  }, [db, healthConnectStepsEnabled]);

  return null;
}
