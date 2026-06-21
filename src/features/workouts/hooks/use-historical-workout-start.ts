import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutTemplate, WorkoutTemplateExercise } from '@/src/db/schema';
import {
  getExercisesByIdsQuery,
  type ExerciseListItem
} from '@/src/features/exercises/repository';
import {
  createHistoricalWorkoutDraft,
  createHistoricalWorkoutDraftFromTemplate,
  getWorkoutTemplateExercisesForTemplatesQuery,
  getWorkoutTemplatesQuery
} from '@/src/features/workouts/repository';
import {
  buildTemplateSummary,
  type WorkoutStartTemplateItem
} from '@/src/features/workouts/hooks/use-workout-start';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';

export function useHistoricalWorkoutStart(dateKey: string) {
  const db = useDrizzle();
  const templateResult = useLiveWithFallback(getWorkoutTemplatesQuery(db), [
    db
  ]);

  const templateIds = useMemo(
    () => templateResult.data.map(template => template.id),
    [templateResult.data]
  );
  const templateIdKey = useMemo(() => templateIds.join(','), [templateIds]);

  const templateExerciseResult = useLiveWithFallback(
    getWorkoutTemplateExercisesForTemplatesQuery(db, templateIds),
    [db, templateIdKey]
  );

  const exerciseIds = useMemo(
    () =>
      Array.from(
        new Set(
          templateExerciseResult.data.map(
            templateExercise => templateExercise.exerciseId
          )
        )
      ),
    [templateExerciseResult.data]
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

  const templateExercisesByTemplateId = useMemo(() => {
    const nextMap = new Map<WorkoutTemplate['id'], WorkoutTemplateExercise[]>();

    for (const templateExercise of templateExerciseResult.data) {
      const existingRows = nextMap.get(templateExercise.templateId) ?? [];

      nextMap.set(templateExercise.templateId, [
        ...existingRows,
        templateExercise
      ]);
    }

    return nextMap;
  }, [templateExerciseResult.data]);

  const templates = useMemo<WorkoutStartTemplateItem[]>(
    () =>
      templateResult.data.map(template => {
        const exerciseRows =
          templateExercisesByTemplateId.get(template.id) ?? [];

        return {
          template,
          exerciseRows,
          exerciseCount: exerciseRows.length,
          exerciseSummary: buildTemplateSummary(exerciseRows, exerciseById)
        };
      }),
    [exerciseById, templateExercisesByTemplateId, templateResult.data]
  );

  const openDraft = useCallback((workoutId: string) => {
    router.push({
      pathname: '/workouts/backfill/[id]',
      params: { id: workoutId }
    });
  }, []);

  const startBlankWorkout = useCallback(() => {
    const draft = createHistoricalWorkoutDraft(db, dateKey);

    openDraft(draft.id);
  }, [dateKey, db, openDraft]);

  const startWorkoutFromTemplate = useCallback(
    (templateId: WorkoutTemplate['id']) => {
      const draft = createHistoricalWorkoutDraftFromTemplate(db, {
        dateKey,
        templateId
      });

      if (draft) {
        openDraft(draft.id);
      }
    },
    [dateKey, db, openDraft]
  );

  return {
    templates,
    startBlankWorkout,
    startWorkoutFromTemplate,
    isLoading:
      !templateResult.isLive ||
      !templateExerciseResult.isLive ||
      !exerciseResult.isLive
  };
}
