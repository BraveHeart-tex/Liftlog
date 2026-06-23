import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutTemplate } from '@/src/db/schema';
import {
  createWorkout,
  createWorkoutFromTemplate,
  deleteWorkoutTemplate,
  getActiveWorkoutSummaryQuery,
  updateWorkoutTemplateName
} from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { formatWorkoutName } from '@/src/lib/utils/workout';
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

  const startWorkout = useCallback(() => {
    createWorkout(db, {
      name: formatWorkoutName(new Date()),
      status: 'in_progress'
    });

    router.push(activeWorkoutRoute);
  }, [db]);

  const resumeWorkout = useCallback(() => {
    router.push(activeWorkoutRoute);
  }, []);

  const startWorkoutFromTemplate = useCallback(
    (templateId: WorkoutTemplate['id']) => {
      const createdWorkout = createWorkoutFromTemplate(db, {
        templateId
      });

      if (createdWorkout) {
        router.push(activeWorkoutRoute);
      }
    },
    [db]
  );

  const discardActiveWorkoutAndStartTemplate = useCallback(
    (templateId: WorkoutTemplate['id']) => {
      const createdWorkout = createWorkoutFromTemplate(db, {
        templateId,
        discardWorkoutId: activeWorkout?.id
      });

      if (createdWorkout) {
        router.push(activeWorkoutRoute);
      }
    },
    [activeWorkout?.id, db]
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
