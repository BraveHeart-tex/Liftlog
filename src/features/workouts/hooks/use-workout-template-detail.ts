import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutTemplate } from '@/src/db/schema';
import {
  getExercisesByIds,
  getExercisesByIdsQuery,
  type ExerciseListItem
} from '@/src/features/exercises/repository';
import {
  createWorkoutFromTemplate,
  deleteWorkoutTemplate,
  getActiveWorkout,
  getActiveWorkoutQuery,
  getWorkoutTemplateById,
  getWorkoutTemplateByIdQuery,
  getWorkoutTemplateExercises,
  getWorkoutTemplateExercisesQuery,
  updateWorkoutTemplateName
} from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { router, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';

const activeWorkoutRoute = '/(tabs)/workout/active' as Href;

export function useWorkoutTemplateDetail(templateId: string | undefined) {
  const db = useDrizzle();
  const resolvedTemplateId = templateId ?? '';

  const templateResult = useLiveWithFallback(
    () => getWorkoutTemplateByIdQuery(db, resolvedTemplateId),
    () => {
      const template = getWorkoutTemplateById(db, resolvedTemplateId);

      return template ? [template] : [];
    },
    [db, resolvedTemplateId]
  );
  const template = templateResult.data[0];

  const activeWorkoutResult = useLiveWithFallback(
    () => getActiveWorkoutQuery(db),
    () => {
      const activeWorkout = getActiveWorkout(db);

      return activeWorkout ? [activeWorkout] : [];
    },
    [db]
  );
  const activeWorkout = activeWorkoutResult.data[0];

  const templateExerciseResult = useLiveWithFallback(
    () => getWorkoutTemplateExercisesQuery(db, resolvedTemplateId),
    () => getWorkoutTemplateExercises(db, resolvedTemplateId),
    [db, resolvedTemplateId]
  );
  const templateExerciseRows = templateExerciseResult.data;

  const exerciseIds = useMemo(
    () =>
      templateExerciseRows.map(templateExercise => templateExercise.exerciseId),
    [templateExerciseRows]
  );
  const exerciseIdKey = useMemo(() => exerciseIds.join(','), [exerciseIds]);
  const exerciseResult = useLiveWithFallback(
    () => getExercisesByIdsQuery(db, exerciseIds),
    () => getExercisesByIds(db, exerciseIds),
    [db, exerciseIdKey]
  );

  const exerciseById = useMemo(
    () =>
      new Map<ExerciseListItem['id'], ExerciseListItem>(
        exerciseResult.data.map(exercise => [exercise.id, exercise])
      ),
    [exerciseResult.data]
  );

  const startWorkoutFromTemplate = useCallback(() => {
    if (!template) {
      return;
    }

    const createdWorkout = createWorkoutFromTemplate(db, {
      templateId: template.id
    });

    if (createdWorkout) {
      router.push(activeWorkoutRoute);
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
      router.push(activeWorkoutRoute);
    }
  }, [activeWorkout, db, template]);

  const resumeWorkout = useCallback(() => {
    router.push(activeWorkoutRoute);
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
    isLoading: Boolean(templateId) && !templateResult.isLive
  };
}
