import { useDrizzle } from '@/src/components/database-provider';
import {
  getActiveWorkoutForRestTimerNotification,
  getActiveWorkoutExerciseForRestTimerNotification
} from '@/src/features/workouts/workout.repository';
import { getRestTimerNotificationData } from '@/src/features/workouts/rest-timer-notifications.service';
import {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponse,
  getLastNotificationResponse,
  type Notification
} from 'expo-notifications';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

interface UseRestTimerNotificationResponsesParams {
  onRestTimerNotificationPress: () => void;
}

export function useRestTimerNotificationResponses({
  onRestTimerNotificationPress
}: UseRestTimerNotificationResponsesParams) {
  const db = useDrizzle();
  const handledNotificationIdsRef = useRef(new Set<string>());

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
        router.replace('/(tabs)/workout');

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
          router.replace({
            pathname: '/(tabs)/workout/exercise/[workoutExerciseId]',
            params: { workoutExerciseId: workoutExercise.id }
          });

          return;
        }
      }

      router.replace('/(tabs)/workout/active');
    },
    [db, onRestTimerNotificationPress]
  );

  useEffect(() => {
    const lastResponse = getLastNotificationResponse();

    if (lastResponse) {
      routeFromNotification(lastResponse.notification);
    }

    const subscription = addNotificationResponseReceivedListener(response => {
      routeFromNotification(response.notification);
    });

    return () => subscription.remove();
  }, [routeFromNotification]);
}
