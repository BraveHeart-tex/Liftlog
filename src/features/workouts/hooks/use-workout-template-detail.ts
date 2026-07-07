import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutTemplate, WorkoutTemplateExercise } from '@/src/db/schema';
import {
  getExercisesByIdsQuery,
  type ExerciseListItem
} from '@/src/features/exercises/exercise.repository';
import { getActiveWorkoutQuery } from '@/src/features/workouts/workout.repository';
import type { TemplateExerciseEditorRow } from '@/src/features/workouts/components/template-exercise-editor';
import {
  createWorkoutFromTemplate,
  deleteWorkoutTemplate,
  getWorkoutTemplateByIdQuery,
  getWorkoutTemplateExercisesQuery,
  updateWorkoutTemplateExercises,
  updateWorkoutTemplateName
} from '@/src/features/workouts/workout-template.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { router, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';

const activeWorkoutRoute = '/(tabs)/workout/active' as Href;

export function useWorkoutTemplateDetail(templateId: string | undefined) {
  const db = useDrizzle();
  const resolvedTemplateId = templateId ?? '';

  const templateResult = useLiveWithFallback(
    getWorkoutTemplateByIdQuery(db, resolvedTemplateId),
    [db, resolvedTemplateId]
  );
  const template = templateResult.data[0];

  const activeWorkoutResult = useLiveWithFallback(getActiveWorkoutQuery(db), [
    db
  ]);
  const activeWorkout = activeWorkoutResult.data[0];

  const templateExerciseResult = useLiveWithFallback(
    getWorkoutTemplateExercisesQuery(db, resolvedTemplateId),
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
    getExercisesByIdsQuery(db, exerciseIds),
    [db, exerciseIdKey]
  );

  const exerciseById = useMemo(
    () =>
      new Map<ExerciseListItem['id'], ExerciseListItem>(
        exerciseResult.data.map(exercise => [exercise.id, exercise])
      ),
    [exerciseResult.data]
  );
  const orderedExercises = useMemo(
    () =>
      templateExerciseRows
        .map(templateExercise => {
          const exercise = exerciseById.get(templateExercise.exerciseId);

          if (!exercise) {
            return null;
          }

          return {
            id: templateExercise.id,
            exercise,
            supersetId: templateExercise.supersetId
          };
        })
        .filter(
          (
            row
          ): row is {
            id: WorkoutTemplateExercise['id'];
            exercise: ExerciseListItem;
            supersetId: WorkoutTemplateExercise['supersetId'];
          } => Boolean(row)
        ),
    [exerciseById, templateExerciseRows]
  );

  const startWorkoutFromTemplate = useCallback(() => {
    if (!template) {
      return;
    }

    const createdWorkout = createWorkoutFromTemplate(db, {
      templateId: template.id
    });

    if (createdWorkout) {
      router.navigate(activeWorkoutRoute);
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
      router.navigate(activeWorkoutRoute);
    }
  }, [activeWorkout, db, template]);

  const resumeWorkout = useCallback(() => {
    router.navigate(activeWorkoutRoute);
  }, []);

  const renameTemplate = useCallback(
    (nextTemplateId: WorkoutTemplate['id'], name: string) =>
      updateWorkoutTemplateName(db, nextTemplateId, name),
    [db]
  );

  const saveTemplateExercises = useCallback(
    (
      nextTemplateId: WorkoutTemplate['id'],
      rows: TemplateExerciseEditorRow[]
    ) =>
      updateWorkoutTemplateExercises(
        db,
        nextTemplateId,
        rows.map(row => ({
          exerciseId: row.exercise.id,
          supersetId: row.supersetId
        }))
      ),
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
    orderedExercises,
    startWorkoutFromTemplate,
    discardActiveWorkoutAndStartTemplate,
    resumeWorkout,
    renameTemplate,
    saveTemplateExercises,
    removeTemplate,
    isLoading: Boolean(templateId) && !templateResult.isLive,
    isLoadingExercises:
      Boolean(templateId) &&
      (!templateExerciseResult.isLive || !exerciseResult.isLive)
  };
}
