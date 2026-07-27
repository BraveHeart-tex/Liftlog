import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutTemplate } from '@/src/db/schema';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer.store';
import {
  createWorkoutFromTemplate,
  deleteWorkoutTemplate,
  getWorkoutTemplateDetailRowsQuery,
  mapWorkoutTemplateDetailRows,
  updateWorkoutTemplateName
} from '@/src/features/workouts/workout-template.repository';
import { getActiveWorkoutQuery } from '@/src/features/workouts/workout.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { router, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';

const activeWorkoutRoute = '/(tabs)/workout/active' as Href;

export function useWorkoutTemplateDetail(templateId: string | undefined) {
  const db = useDrizzle();
  const resolvedTemplateId = templateId ?? '';

  const templateDetailResult = useLiveWithFallback(
    getWorkoutTemplateDetailRowsQuery(db, resolvedTemplateId),
    [db, resolvedTemplateId]
  );
  const { template, templateExerciseRows, exerciseById } = useMemo(
    () => mapWorkoutTemplateDetailRows(templateDetailResult.data),
    [templateDetailResult.data]
  );

  const activeWorkoutResult = useLiveWithFallback(getActiveWorkoutQuery(db), [
    db
  ]);
  const activeWorkout = activeWorkoutResult.data[0];

  const startWorkoutFromTemplate = useCallback(() => {
    if (!template) {
      return;
    }

    const createdWorkout = createWorkoutFromTemplate(db, {
      templateId: template.id
    });

    if (createdWorkout) {
      router.replace(activeWorkoutRoute, { withAnchor: true });
    }
  }, [db, template]);

  const discardActiveWorkoutAndStartTemplate = useCallback(() => {
    if (!activeWorkout || !template) {
      return;
    }

    const createdWorkout = createWorkoutFromTemplate(db, {
      templateId: template.id,
      discardWorkoutId: activeWorkout.id
    });

    if (createdWorkout) {
      useRestTimerStore.getState().cancelForWorkout(activeWorkout.id);
      router.replace(activeWorkoutRoute, { withAnchor: true });
    }
  }, [activeWorkout, db, template]);

  const resumeWorkout = useCallback(() => {
    router.replace(activeWorkoutRoute, { withAnchor: true });
  }, []);

  const renameTemplate = useCallback(
    (nextTemplateId: WorkoutTemplate['id'], name: string) =>
      updateWorkoutTemplateName(db, nextTemplateId, name),
    [db]
  );

  const removeTemplate = useCallback(
    (nextTemplateId: WorkoutTemplate['id']) => {
      deleteWorkoutTemplate(db, nextTemplateId);
    },
    [db]
  );

  return {
    activeWorkout,
    template,
    templateExerciseRows,
    exerciseById,
    startWorkoutFromTemplate,
    discardActiveWorkoutAndStartTemplate,
    resumeWorkout,
    renameTemplate,
    removeTemplate,
    isLoading: Boolean(templateId) && !templateDetailResult.isLive,
    isLoadingExercises: Boolean(templateId) && !templateDetailResult.isLive
  };
}
