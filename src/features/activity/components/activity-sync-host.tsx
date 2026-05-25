import { useDrizzle } from '@/src/components/database-provider';
import {
  getTodayStepDay,
  upsertStepDays
} from '@/src/features/activity/repository';
import { syncStepDaysFromHealthConnect } from '@/src/features/activity/health-connect';
import {
  registerStepNotificationNavigation,
  showStepNotification,
  startStepNotificationRefresh,
  stopStepNotification
} from '@/src/features/activity/notifications';
import { useSettings } from '@/src/features/settings/hooks';
import { getTodayDateKey } from '@/src/features/activity/date';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export function ActivitySyncHost() {
  if (Platform.OS !== 'android') {
    return null;
  }

  return <AndroidActivitySyncHost />;
}

function AndroidActivitySyncHost() {
  const db = useDrizzle();
  const { healthConnectStepsEnabled, stepsNotificationEnabled, stepGoal } =
    useSettings();
  const didLaunchSyncRef = useRef(false);

  useEffect(() => {
    return registerStepNotificationNavigation();
  }, []);

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
    if (!stepsNotificationEnabled) {
      void stopStepNotification();

      return;
    }

    const today = getTodayStepDay(db, getTodayDateKey());

    if (today) {
      void showStepNotification({ steps: today.steps, goal: stepGoal });
    }

    startStepNotificationRefresh(stepGoal);
  }, [db, stepGoal, stepsNotificationEnabled]);

  return null;
}
