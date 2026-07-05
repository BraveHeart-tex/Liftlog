import { useDrizzle } from '@/src/components/database-provider';
import {
  getActiveWorkoutForRestTimerNotification,
  getActiveWorkoutExerciseForRestTimerNotification
} from '@/src/features/workouts/workout.repository';
import { getRestTimerNotificationData } from '@/src/features/workouts/rest-timer-notifications.service';
import {
  clearLastNotificationResponse,
  DEFAULT_ACTION_IDENTIFIER,
  type Notification,
  useLastNotificationResponse
} from 'expo-notifications';
import { router, type Href, useNavigationContainerRef } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

interface UseRestTimerNotificationResponsesParams {
  onRestTimerNotificationPress: () => void;
}

const ROUTER_READY_RETRY_DELAY_MS = 50;
const ROUTER_READY_MAX_RETRIES = 20;

export function useRestTimerNotificationResponses({
  onRestTimerNotificationPress
}: UseRestTimerNotificationResponsesParams) {
  const db = useDrizzle();
  const lastNotificationResponse = useLastNotificationResponse();
  const navigationRef = useNavigationContainerRef();
  const handledNotificationIdsRef = useRef(new Set<string>());
  const navigationRetryTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const clearNavigationRetryTimeout = useCallback(() => {
    if (navigationRetryTimeoutRef.current) {
      clearTimeout(navigationRetryTimeoutRef.current);
      navigationRetryTimeoutRef.current = null;
    }
  }, []);

  const replaceWhenRouterReady = useCallback(
    (href: Href, retryCount = 0) => {
      clearNavigationRetryTimeout();

      if (!navigationRef.isReady()) {
        if (retryCount >= ROUTER_READY_MAX_RETRIES) {
          console.error('Timed out routing from rest timer notification');

          return;
        }

        navigationRetryTimeoutRef.current = setTimeout(() => {
          replaceWhenRouterReady(href, retryCount + 1);
        }, ROUTER_READY_RETRY_DELAY_MS);

        return;
      }

      router.replace(href);
    },
    [clearNavigationRetryTimeout, navigationRef]
  );

  const routeFromNotification = useCallback(
    (notification: Notification) => {
      const notificationId = `${notification.request.identifier}:${notification.date}`;

      if (handledNotificationIdsRef.current.has(notificationId)) {
        return;
      }

      const data = getRestTimerNotificationData(
        notification.request.content.data
      );

      if (!data) {
        return;
      }

      handledNotificationIdsRef.current.add(notificationId);
      clearLastNotificationResponse();
      onRestTimerNotificationPress();

      const activeWorkout = getActiveWorkoutForRestTimerNotification(
        db,
        data.workoutId
      );

      if (!activeWorkout) {
        replaceWhenRouterReady('/(tabs)/workout');

        return;
      }

      if (data.workoutExerciseId) {
        const workoutExercise =
          getActiveWorkoutExerciseForRestTimerNotification(
            db,
            activeWorkout.id,
            data.workoutExerciseId
          );

        if (workoutExercise) {
          replaceWhenRouterReady({
            pathname: '/(tabs)/workout/exercise/[workoutExerciseId]',
            params: { workoutExerciseId: workoutExercise.id }
          });

          return;
        }
      }

      replaceWhenRouterReady('/(tabs)/workout/active');
    },
    [db, onRestTimerNotificationPress, replaceWhenRouterReady]
  );

  useEffect(() => {
    if (
      !lastNotificationResponse ||
      lastNotificationResponse.actionIdentifier !== DEFAULT_ACTION_IDENTIFIER
    ) {
      return;
    }

    routeFromNotification(lastNotificationResponse.notification);
  }, [lastNotificationResponse, routeFromNotification]);

  useEffect(() => clearNavigationRetryTimeout, [clearNavigationRetryTimeout]);
}
