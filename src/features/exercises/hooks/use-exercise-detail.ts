import { useDrizzle } from '@/src/components/database-provider';
import type { Set } from '@/src/db/schema';
import {
  getExerciseById,
  getExerciseByIdQuery,
  getExercises,
  getExercisesQuery,
  getExerciseTemplateUsageRowsQuery,
  getExerciseUsageRowsQuery
} from '@/src/features/exercises/repository';
import {
  buildExerciseHistory,
  computeEstimated1RM,
  getExerciseHistorySetsQuery,
  getExerciseHistoryWorkoutsQuery,
  getPersonalRecordsByExercise,
  getPersonalRecordsByExerciseQuery
} from '@/src/features/progress/repository';
import { useSettings } from '@/src/features/settings/hooks';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { parseMuscleList } from '@/src/lib/utils/muscle';
import { formatCompletedSets, getCompletedSets } from '@/src/lib/utils/set';
import { useMemo } from 'react';

function getBestSetId(sets: Set[]) {
  if (sets.length === 0) {
    return undefined;
  }

  return sets.reduce((best, set) =>
    computeEstimated1RM(set.weightKg, set.reps) >
    computeEstimated1RM(best.weightKg, best.reps)
      ? set
      : best
  ).id;
}

export function useExerciseDetail(exerciseId: string | undefined) {
  const db = useDrizzle();
  const { weightUnit } = useSettings();
  const resolvedExerciseId = exerciseId ?? '';
  const exerciseResult = useLiveWithFallback(
    () => getExerciseByIdQuery(db, resolvedExerciseId),
    () => {
      const exercise = getExerciseById(db, resolvedExerciseId);

      return exercise ? [exercise] : [];
    },
    [db, resolvedExerciseId]
  );
  const exercise = exerciseResult.data[0];

  const exerciseListResult = useLiveWithFallback(
    () => getExercisesQuery(db),
    () => getExercises(db),
    [db]
  );

  const exerciseUsageResult = useLiveWithFallback(
    () => getExerciseUsageRowsQuery(db, resolvedExerciseId),
    () => getExerciseUsageRowsQuery(db, resolvedExerciseId).all(),
    [db, resolvedExerciseId]
  );

  const templateUsageResult = useLiveWithFallback(
    () => getExerciseTemplateUsageRowsQuery(db, resolvedExerciseId),
    () => getExerciseTemplateUsageRowsQuery(db, resolvedExerciseId).all(),
    [db, resolvedExerciseId]
  );

  const workoutResult = useLiveWithFallback(
    () => getExerciseHistoryWorkoutsQuery(db, resolvedExerciseId),
    () => getExerciseHistoryWorkoutsQuery(db, resolvedExerciseId).all(),
    [db, resolvedExerciseId]
  );

  const workoutRows = workoutResult.data;
  const workoutIds = useMemo(
    () =>
      Array.from(new Set(workoutRows.map(row => row.workout.id))).slice(0, 20),
    [workoutRows]
  );

  const workoutIdKey = useMemo(() => workoutIds.join(','), [workoutIds]);

  const setResult = useLiveWithFallback(
    () => getExerciseHistorySetsQuery(db, resolvedExerciseId, workoutIds),
    () => getExerciseHistorySetsQuery(db, resolvedExerciseId, workoutIds).all(),
    [db, resolvedExerciseId, workoutIdKey]
  );

  const prResult = useLiveWithFallback(
    () => getPersonalRecordsByExerciseQuery(db, resolvedExerciseId),
    () => getPersonalRecordsByExercise(db, resolvedExerciseId),
    [db, resolvedExerciseId]
  );

  const history = useMemo(
    () =>
      buildExerciseHistory(workoutRows, setResult.data)
        .map(entry => {
          const completedSets = entry.sets.filter(
            set => set.status === 'completed'
          );

          return {
            ...entry,
            sets: completedSets,
            bestSetId: getBestSetId(completedSets)
          };
        })
        .filter(entry => entry.sets.length > 0)
        .slice(0, 10),
    [setResult.data, workoutRows]
  );

  const primaryMuscles = useMemo(
    () => parseMuscleList(exercise?.primaryMuscles ?? '[]'),
    [exercise?.primaryMuscles]
  );

  const secondaryMuscles = useMemo(
    () => parseMuscleList(exercise?.secondaryMuscles ?? '[]'),
    [exercise?.secondaryMuscles]
  );

  const instructions = exercise?.instructions?.trim();

  const mostRecentHistory = useMemo(
    () =>
      buildExerciseHistory(workoutRows, setResult.data).find(
        historyEntry => getCompletedSets(historyEntry.sets).length > 0
      ),
    [setResult.data, workoutRows]
  );

  const completedSets = mostRecentHistory
    ? getCompletedSets(mostRecentHistory.sets)
    : [];

  const completedSetSummary = formatCompletedSets(completedSets, weightUnit);

  return {
    exercise,
    exercises: exerciseListResult.data,
    exerciseUsageCount:
      exerciseUsageResult.data.length + templateUsageResult.data.length,
    workoutUsageCount: exerciseUsageResult.data.length,
    templateUsageCount: templateUsageResult.data.length,
    history,
    prRows: prResult.data,
    primaryMuscles,
    secondaryMuscles,
    instructions,
    mostRecentHistory,
    completedSetSummary,
    weightUnit,
    isLoading: Boolean(exerciseId) && !exerciseResult.isLive
  };
}
