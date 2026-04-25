import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutTemplate, WorkoutTemplateExercise } from '@/src/db/schema';
import {
  getExercisesByIds,
  getExercisesByIdsQuery,
  type ExerciseListItem
} from '@/src/features/exercises/repository';
import {
  createWorkout,
  createWorkoutFromTemplate,
  deleteWorkoutTemplate,
  getActiveWorkout,
  getActiveWorkoutQuery,
  getWorkouts,
  getWorkoutsQuery,
  getWorkoutTemplateExercisesForTemplates,
  getWorkoutTemplateExercisesForTemplatesQuery,
  getWorkoutTemplates,
  getWorkoutTemplatesQuery,
  updateWorkoutTemplateName
} from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { formatWorkoutName } from '@/src/lib/utils/workout';
import { router, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';

const activeWorkoutRoute = '/(tabs)/workout/active' as Href;

export interface WorkoutStartTemplateItem {
  template: WorkoutTemplate;
  exerciseRows: WorkoutTemplateExercise[];
  exerciseCount: number;
  exerciseSummary: string;
}

function buildTemplateSummary(
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

export function useWorkoutStart() {
  const db = useDrizzle();
  const activeWorkoutResult = useLiveWithFallback(
    () => getActiveWorkoutQuery(db),
    () => {
      const activeWorkout = getActiveWorkout(db);

      return activeWorkout ? [activeWorkout] : [];
    },
    [db]
  );
  const completedWorkoutsResult = useLiveWithFallback(
    () => getWorkoutsQuery(db),
    () => getWorkouts(db),
    [db]
  );
  const templateResult = useLiveWithFallback(
    () => getWorkoutTemplatesQuery(db),
    () => getWorkoutTemplates(db),
    [db]
  );

  const templateIds = useMemo(
    () => templateResult.data.map(template => template.id),
    [templateResult.data]
  );

  const templateIdKey = useMemo(() => templateIds.join(','), [templateIds]);

  const templateExerciseResult = useLiveWithFallback(
    () => getWorkoutTemplateExercisesForTemplatesQuery(db, templateIds),
    () => getWorkoutTemplateExercisesForTemplates(db, templateIds),
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
    () => getExercisesByIdsQuery(db, exerciseIds),
    () => getExercisesByIds(db, exerciseIds),
    [db, exerciseIdKey]
  );

  const activeWorkout = activeWorkoutResult.data[0];
  const recentWorkouts = useMemo(
    () => completedWorkoutsResult.data.slice(0, 5),
    [completedWorkoutsResult.data]
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

  const templates = useMemo(
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
    recentWorkouts,
    templates,
    startWorkout,
    resumeWorkout,
    startWorkoutFromTemplate,
    discardActiveWorkoutAndStartTemplate,
    renameTemplate,
    removeTemplate
  };
}
