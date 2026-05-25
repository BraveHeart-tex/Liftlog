import { Platform } from 'react-native';
import { requestActivityRecognitionPermission } from '@/src/features/steps/step-counter-permissions';
import { StepCounter } from 'expo-step-counter';
import notifee, { AuthorizationStatus } from 'react-native-notify-kit';
import { readTodayStepCount } from './health-connect';

const STEP_NOTIFICATION_ID = 'steps';
const STEP_NOTIFICATION_REFRESH_MS = 15 * 60 * 1000;

let notificationInterval: ReturnType<typeof setInterval> | null = null;

export async function requestStepNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const settings = await notifee.requestPermission();

  return (
    (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL) &&
    (await requestActivityRecognitionPermission())
  );
}

export async function showStepNotification({
  steps,
  goal
}: {
  steps: number;
  goal: number;
}): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  StepCounter.start(steps, goal);
}

export async function stopStepNotification(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }

  StepCounter.stop();
  await notifee.cancelNotification(STEP_NOTIFICATION_ID);
}

export async function refreshStepNotification(goal: number): Promise<void> {
  const steps = await readTodayStepCount();

  if (steps === null) {
    return;
  }

  await showStepNotification({ steps, goal });
}

export function startStepNotificationRefresh(goal: number): void {
  if (Platform.OS !== 'android') {
    return;
  }

  if (notificationInterval) {
    clearInterval(notificationInterval);
  }

  void refreshStepNotification(goal);

  notificationInterval = setInterval(() => {
    void refreshStepNotification(goal);
  }, STEP_NOTIFICATION_REFRESH_MS);
}
