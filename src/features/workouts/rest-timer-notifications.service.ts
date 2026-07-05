import {
  AndroidImportance,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
  cancelScheduledNotificationAsync,
  dismissNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type NotificationPermissionsStatus
} from 'expo-notifications';
import { Platform } from 'react-native';

const REST_TIMER_NOTIFICATION_CHANNEL_ID = 'rest-timer';
const REST_TIMER_NOTIFICATION_ID_PREFIX = 'rest-timer';
const REST_TIMER_NOTIFICATION_TYPE = 'rest-timer';

export interface RestTimerNotificationContext {
  workoutId?: string;
  workoutExerciseId?: string;
  exerciseName?: string;
}

export interface RestTimerNotificationData extends RestTimerNotificationContext {
  type: typeof REST_TIMER_NOTIFICATION_TYPE;
}

interface ScheduleRestTimerNotificationParams {
  seconds: number;
  context: RestTimerNotificationContext;
}

let scheduledRestTimerNotificationId: string | null = null;
let channelPromise: Promise<void> | null = null;
let notificationGeneration = 0;

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

function isGranted(status: NotificationPermissionsStatus) {
  if (Platform.OS === 'ios') {
    return (
      status.ios?.status === IosAuthorizationStatus.AUTHORIZED ||
      status.ios?.status === IosAuthorizationStatus.PROVISIONAL ||
      status.ios?.status === IosAuthorizationStatus.EPHEMERAL
    );
  }

  return status.granted;
}

async function ensureRestTimerNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  channelPromise ??= setNotificationChannelAsync(
    REST_TIMER_NOTIFICATION_CHANNEL_ID,
    {
      name: 'Rest timer',
      importance: AndroidImportance.DEFAULT,
      enableVibrate: true
    }
  ).then(() => undefined);

  await channelPromise;
}

async function requestRestTimerNotificationPermission() {
  await ensureRestTimerNotificationChannel();

  const existingPermission = await getPermissionsAsync();

  if (isGranted(existingPermission)) {
    return true;
  }

  const nextPermission = await requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: false
    }
  });

  return isGranted(nextPermission);
}

async function cancelScheduledRestTimerNotification() {
  const notificationId = scheduledRestTimerNotificationId;

  scheduledRestTimerNotificationId = null;

  if (!notificationId) {
    return;
  }

  await Promise.allSettled([
    cancelScheduledNotificationAsync(notificationId),
    dismissNotificationAsync(notificationId)
  ]);
}

export async function cancelRestTimerNotification() {
  notificationGeneration += 1;

  await cancelScheduledRestTimerNotification();
}

export async function scheduleRestTimerNotification({
  seconds,
  context
}: ScheduleRestTimerNotificationParams) {
  const generation = notificationGeneration + 1;

  notificationGeneration = generation;

  await cancelScheduledRestTimerNotification();

  if (seconds <= 0) {
    return;
  }

  const hasPermission = await requestRestTimerNotificationPermission();

  if (!hasPermission || generation !== notificationGeneration) {
    return;
  }

  const body = context.exerciseName
    ? `Back to ${context.exerciseName}`
    : 'Back to your workout';

  const notificationId = await scheduleNotificationAsync({
    identifier: `${REST_TIMER_NOTIFICATION_ID_PREFIX}-${generation}`,
    content: {
      title: 'Rest time is up',
      body,
      sound: true,
      autoDismiss: true,
      data: {
        type: REST_TIMER_NOTIFICATION_TYPE,
        workoutId: context.workoutId,
        workoutExerciseId: context.workoutExerciseId,
        exerciseName: context.exerciseName
      } satisfies RestTimerNotificationData
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      channelId: REST_TIMER_NOTIFICATION_CHANNEL_ID,
      seconds,
      repeats: false
    }
  });

  if (generation !== notificationGeneration) {
    await Promise.allSettled([
      cancelScheduledNotificationAsync(notificationId),
      dismissNotificationAsync(notificationId)
    ]);

    return;
  }

  scheduledRestTimerNotificationId = notificationId;
}

export function getRestTimerNotificationData(
  data: Record<string, unknown>
): RestTimerNotificationData | null {
  if (data.type !== REST_TIMER_NOTIFICATION_TYPE) {
    return null;
  }

  return {
    type: REST_TIMER_NOTIFICATION_TYPE,
    workoutId: typeof data.workoutId === 'string' ? data.workoutId : undefined,
    workoutExerciseId:
      typeof data.workoutExerciseId === 'string'
        ? data.workoutExerciseId
        : undefined,
    exerciseName:
      typeof data.exerciseName === 'string' ? data.exerciseName : undefined
  };
}
