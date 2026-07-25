import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutTemplate } from '@/src/db/schema';
import {
  createWorkout,
  getActiveWorkoutSummaryQuery
} from '@/src/features/workouts/workout.repository';
import {
  createWorkoutFromTemplate,
  deleteWorkoutTemplate,
  updateWorkoutTemplateName
} from '@/src/features/workouts/workout-template.repository';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer.store';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { formatWorkoutName } from '@/src/features/workouts/workout-display.utils';
import { router, type Href } from 'expo-router';
import { useCallback } from 'react';

const activeWorkoutRoute: Href = '/(tabs)/workout/active';

export function useWorkoutStart() {
  const db = useDrizzle();
  const activeWorkoutResult = useLiveWithFallback(
    getActiveWorkoutSummaryQuery(db),
    [db]
  );

  const activeWorkoutSummary = activeWorkoutResult.data[0];
  const activeWorkout = activeWorkoutSummary
    ? {
        ...activeWorkoutSummary.workout,
        exerciseCount: activeWorkoutSummary.exerciseCount,
        completedSetCount: activeWorkoutSummary.completedSetCount
      }
    : undefined;
  const activeWorkoutId = activeWorkout?.id;

  const startWorkout = useCallback(() => {
    createWorkout(db, {
      name: formatWorkoutName(new Date()),
      status: 'in_progress'
    });

    router.navigate(activeWorkoutRoute);
  }, [db]);

  const resumeWorkout = useCallback(() => {
    router.navigate(activeWorkoutRoute);
  }, []);

  const startWorkoutFromTemplate = useCallback(
    (templateId: WorkoutTemplate['id']) => {
      const createdWorkout = createWorkoutFromTemplate(db, {
        templateId
      });

      if (createdWorkout) {
        router.navigate(activeWorkoutRoute);
      }
    },
    [db]
  );

  const discardActiveWorkoutAndStartTemplate = useCallback(
    (templateId: WorkoutTemplate['id']) => {
      const createdWorkout = createWorkoutFromTemplate(db, {
        templateId,
        discardWorkoutId: activeWorkoutId
      });

      if (createdWorkout) {
        if (activeWorkoutId) {
          useRestTimerStore.getState().cancelForWorkout(activeWorkoutId);
        }

        router.navigate(activeWorkoutRoute);
      }
    },
    [activeWorkoutId, db]
  );

  const renameTemplate = useCallback(
    (templateId: WorkoutTemplate['id'], name: string) =>
      updateWorkoutTemplateName(db, templateId, name),
    [db]
  );

  const removeTemplate = useCallback(
    (templateId: WorkoutTemplate['id']) => {
      deleteWorkoutTemplate(db, templateId);
    },
    [db]
  );

  return {
    activeWorkout,
    startWorkout,
    resumeWorkout,
    startWorkoutFromTemplate,
    discardActiveWorkoutAndStartTemplate,
    renameTemplate,
    removeTemplate
  };
}
