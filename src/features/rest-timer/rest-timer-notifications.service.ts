import {
  AndroidImportance,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
  cancelScheduledNotificationAsync,
  deleteNotificationChannelAsync,
  dismissNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPresentedNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type NotificationPermissionsStatus
} from 'expo-notifications';
import { AppState, Linking, Platform } from 'react-native';
import { getNotificationPresentation } from '@/src/features/rest-timer/rest-timer-notification-policy';

const REST_TIMER_NOTIFICATION_CHANNEL_ID = 'rest-timer-v2';
const OBSOLETE_REST_TIMER_NOTIFICATION_CHANNEL_ID = 'rest-timer';
const REST_TIMER_NOTIFICATION_ID_PREFIX = 'rest-timer';
const REST_TIMER_NOTIFICATION_TYPE = 'rest-timer';

interface RestTimerNotificationContext {
  workoutId?: string;
  workoutExerciseId?: string;
  exerciseName?: string;
}

interface RestTimerNotificationData extends RestTimerNotificationContext {
  type: typeof REST_TIMER_NOTIFICATION_TYPE;
  deadlineEpochMs?: number;
}

interface ScheduleRestTimerNotificationParams {
  deadlineEpochMs: number;
  context: RestTimerNotificationContext;
}

let scheduledRestTimerNotificationId: string | null = null;
let channelPromise: Promise<void> | null = null;
let notificationGeneration = 0;
const permissionChangeListeners = new Set<() => void>();

setNotificationHandler({
  handleNotification: async notification =>
    getNotificationPresentation(
      getRestTimerNotificationData(notification.request.content.data) !== null,
      AppState.currentState
    )
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
      importance: AndroidImportance.HIGH,
      enableVibrate: true,
      sound: 'rest-timer-finished.wav'
    }
  ).then(async () => {
    await deleteNotificationChannelAsync(
      OBSOLETE_REST_TIMER_NOTIFICATION_CHANNEL_ID
    );
  });

  await channelPromise;
}

export async function requestRestTimerNotificationPermission() {
  await ensureRestTimerNotificationChannel();

  const existingPermission = await getPermissionsAsync();

  if (isGranted(existingPermission)) {
    return true;
  }

  if (!existingPermission.canAskAgain) {
    return false;
  }

  const nextPermission = await requestPermissionsAsync();

  const granted = isGranted(nextPermission);
  permissionChangeListeners.forEach(listener => listener());

  return granted;
}

export function subscribeToRestTimerNotificationPermissionChanges(
  listener: () => void
) {
  permissionChangeListeners.add(listener);

  return () => {
    permissionChangeListeners.delete(listener);
  };
}

export async function getRestTimerNotificationPermission() {
  const status = await getPermissionsAsync();

  return { granted: isGranted(status), canAskAgain: status.canAskAgain };
}

export const openRestTimerNotificationSettings = () => Linking.openSettings();

async function cancelScheduledRestTimerNotification({
  dismiss
}: {
  dismiss: boolean;
}) {
  const scheduledNotifications = await getAllScheduledNotificationsAsync();
  const presentedNotifications = dismiss
    ? await getPresentedNotificationsAsync()
    : [];
  const notificationIds = new Set(
    scheduledNotifications
      .filter(
        notification =>
          notification.identifier.startsWith(
            REST_TIMER_NOTIFICATION_ID_PREFIX
          ) || getRestTimerNotificationData(notification.content.data) !== null
      )
      .map(notification => notification.identifier)
  );

  for (const notification of presentedNotifications) {
    if (
      notification.request.identifier.startsWith(
        REST_TIMER_NOTIFICATION_ID_PREFIX
      ) ||
      getRestTimerNotificationData(notification.request.content.data) !== null
    ) {
      notificationIds.add(notification.request.identifier);
    }
  }

  if (scheduledRestTimerNotificationId) {
    notificationIds.add(scheduledRestTimerNotificationId);
  }

  scheduledRestTimerNotificationId = null;

  if (notificationIds.size === 0) {
    return;
  }

  await Promise.allSettled(
    [...notificationIds].flatMap(notificationId => [
      cancelScheduledNotificationAsync(notificationId),
      ...(dismiss ? [dismissNotificationAsync(notificationId)] : [])
    ])
  );
}

export async function cancelRestTimerNotification() {
  notificationGeneration += 1;

  await cancelScheduledRestTimerNotification({ dismiss: true });
}

export async function cancelPendingRestTimerNotification() {
  notificationGeneration += 1;

  await cancelScheduledRestTimerNotification({ dismiss: false });
}

export async function hasDeliveredRestTimerNotification(
  deadlineEpochMs: number
) {
  const notifications = await getPresentedNotificationsAsync();

  return notifications.some(notification => {
    const data = getRestTimerNotificationData(
      notification.request.content.data
    );

    return data?.deadlineEpochMs === deadlineEpochMs;
  });
}

export async function scheduleRestTimerNotification({
  deadlineEpochMs,
  context
}: ScheduleRestTimerNotificationParams) {
  const generation = notificationGeneration + 1;

  notificationGeneration = generation;

  await cancelScheduledRestTimerNotification({ dismiss: true });
  await ensureRestTimerNotificationChannel();

  if (deadlineEpochMs <= Date.now()) {
    return;
  }

  const permission = await getRestTimerNotificationPermission();

  if (!permission.granted || generation !== notificationGeneration) {
    return;
  }

  const body = context.exerciseName
    ? `Back to ${context.exerciseName}`
    : undefined;

  const notificationId = await scheduleNotificationAsync({
    identifier: `${REST_TIMER_NOTIFICATION_ID_PREFIX}-${generation}`,
    content: {
      title: 'Rest time is up',
      body,
      sound: 'rest-timer-finished.wav',
      autoDismiss: true,
      data: {
        type: REST_TIMER_NOTIFICATION_TYPE,
        deadlineEpochMs,
        workoutId: context.workoutId,
        workoutExerciseId: context.workoutExerciseId,
        exerciseName: context.exerciseName
      } satisfies RestTimerNotificationData
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      channelId: REST_TIMER_NOTIFICATION_CHANNEL_ID,
      date: new Date(deadlineEpochMs)
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
    deadlineEpochMs:
      Number.isSafeInteger(data.deadlineEpochMs) &&
      (data.deadlineEpochMs as number) >= 0
        ? (data.deadlineEpochMs as number)
        : undefined,
    workoutId: typeof data.workoutId === 'string' ? data.workoutId : undefined,
    workoutExerciseId:
      typeof data.workoutExerciseId === 'string'
        ? data.workoutExerciseId
        : undefined,
    exerciseName:
      typeof data.exerciseName === 'string' ? data.exerciseName : undefined
  };
}
