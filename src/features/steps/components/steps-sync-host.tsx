import { useDrizzle } from '@/src/components/database-provider';
import {
  getTodayStepDay,
  upsertStepDays
} from '@/src/features/steps/steps.repository';
import { syncStepDaysFromHealthConnect } from '@/src/features/steps/health-connect.service';
import {
  showStepNotification,
  startStepNotificationRefresh,
  stopStepNotification
} from '@/src/features/steps/steps-notifications.service';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { getTodayDateKey } from '@/src/features/steps/steps-date.utils';
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
  const { healthConnectStepsEnabled, stepsNotificationEnabled, stepGoal } =
    useSettings();
  const didLaunchSyncRef = useRef(false);

  useEffect(() => {
    if (!healthConnectStepsEnabled || didLaunchSyncRef.current) {
      return;
    }

    didLaunchSyncRef.current = true;

    void syncStepDaysFromHealthConnect({ isInitial: false })
      .then(result => {
        if (result.days.length === 0) {
          return;
        }

        upsertStepDays(db, result.days);
      })
      .catch(error => {
        console.error('Launch step sync failed', error);
      });
  }, [db, healthConnectStepsEnabled]);

  useEffect(() => {
    if (!healthConnectStepsEnabled || !stepsNotificationEnabled) {
      void stopStepNotification();

      return;
    }

    const today = getTodayStepDay(db, getTodayDateKey());

    if (today) {
      void showStepNotification({ steps: today.steps, goal: stepGoal });
    }

    startStepNotificationRefresh(stepGoal);
  }, [db, healthConnectStepsEnabled, stepGoal, stepsNotificationEnabled]);

  return null;
}
