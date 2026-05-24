import { Platform } from 'react-native';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  EventType
} from 'react-native-notify-kit';
import { router } from 'expo-router';
import { readTodayStepCount } from './health-connect';

const STEP_CHANNEL_ID = 'activity_steps';
const STEP_NOTIFICATION_ID = 'activity-steps';
const STEP_NOTIFICATION_REFRESH_MS = 15 * 60 * 1000;

let didRegisterForegroundService = false;
let notificationInterval: ReturnType<typeof setInterval> | null = null;

function formatSteps(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0
  }).format(value);
}

function getProgressPercent(steps: number, goal: number): number {
  if (goal <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((steps / goal) * 100));
}

function registerForegroundService(): void {
  if (Platform.OS !== 'android' || didRegisterForegroundService) {
    return;
  }

  didRegisterForegroundService = true;

  notifee.registerForegroundService(() => {
    return new Promise(() => undefined);
  });
}

async function ensureStepChannel(): Promise<string> {
  return notifee.createChannel({
    id: STEP_CHANNEL_ID,
    name: 'Steps',
    importance: AndroidImportance.LOW,
    vibration: false
  });
}

export async function requestStepNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const settings = await notifee.requestPermission();

  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
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

  registerForegroundService();

  const channelId = await ensureStepChannel();
  const progressPercent = getProgressPercent(steps, goal);

  await notifee.displayNotification({
    id: STEP_NOTIFICATION_ID,
    title: 'LiftLog steps',
    body: `${formatSteps(steps)} / ${formatSteps(goal)} steps today`,
    data: {
      route: 'activity'
    },
    android: {
      asForegroundService: true,
      category: AndroidCategory.STATUS,
      channelId,
      ongoing: true,
      onlyAlertOnce: true,
      pressAction: {
        id: 'default',
        launchActivity: 'default'
      },
      progress: {
        max: 100,
        current: progressPercent
      },
      visibility: AndroidVisibility.PUBLIC
    }
  });
}

export async function stopStepNotification(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }

  await notifee.stopForegroundService();
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

  registerForegroundService();

  if (notificationInterval) {
    clearInterval(notificationInterval);
  }

  void refreshStepNotification(goal);

  notificationInterval = setInterval(() => {
    void refreshStepNotification(goal);
  }, STEP_NOTIFICATION_REFRESH_MS);
}

export function registerStepNotificationNavigation(): () => void {
  if (Platform.OS !== 'android') {
    return () => undefined;
  }

  const unsubscribe = notifee.onForegroundEvent(({ detail, type }) => {
    if (
      type !== EventType.PRESS ||
      detail.notification?.data?.route !== 'activity'
    ) {
      return;
    }

    router.push('/(tabs)/activity');
  });

  void notifee.getInitialNotification().then(initialNotification => {
    if (initialNotification?.notification.data?.route === 'activity') {
      router.push('/(tabs)/activity');
    }
  });

  return unsubscribe;
}
