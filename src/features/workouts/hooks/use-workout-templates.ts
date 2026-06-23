import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutTemplate, WorkoutTemplateExercise } from '@/src/db/schema';
import {
  getExercisesByIdsQuery,
  type ExerciseListItem
} from '@/src/features/exercises/repository';
import {
  getWorkoutTemplateExercisesForTemplatesQuery,
  getWorkoutTemplatesQuery
} from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo } from 'react';

interface UseWorkoutTemplatesOptions {
  enabled?: boolean;
}

export interface WorkoutStartTemplateItem {
  template: WorkoutTemplate;
  exerciseRows: WorkoutTemplateExercise[];
  exerciseCount: number;
  exerciseSummary: string;
}

export function buildTemplateSummary(
  exerciseRows: WorkoutTemplateExercise[],
  exerciseById: Map<ExerciseListItem['id'], ExerciseListItem>
): string {
  const exerciseNames = exerciseRows
    .map(exercise => exerciseById.get(exercise.exerciseId)?.name)
    .filter((name): name is string => Boolean(name));

  if (exerciseNames.length === 0) {
    return 'No exercises';
  }

  if (exerciseNames.length <= 2) {
    return exerciseNames.join(' • ');
  }

  return `${exerciseNames.slice(0, 2).join(' • ')} +${exerciseNames.length - 2} more`;
}

export function useWorkoutTemplates(options?: UseWorkoutTemplatesOptions) {
  const { enabled = true } = options ?? {};
  const db = useDrizzle();
  const templateResult = useLiveWithFallback(
    getWorkoutTemplatesQuery(db),
    [db, enabled],
    { enabled }
  );

  const templateIds = useMemo(
    () => templateResult.data.map(template => template.id),
    [templateResult.data]
  );
  const templateIdKey = useMemo(() => templateIds.join(','), [templateIds]);

  const templateExerciseResult = useLiveWithFallback(
    getWorkoutTemplateExercisesForTemplatesQuery(db, templateIds),
    [db, templateIdKey, enabled],
    { enabled }
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
    [db, exerciseIdKey, enabled],
    { enabled }
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

  return {
    templates,
    isLoading:
      enabled &&
      (!templateResult.isLive ||
        !templateExerciseResult.isLive ||
        !exerciseResult.isLive)
  };
}
