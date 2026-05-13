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
  getExerciseHistoryWorkoutsQuery
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

interface CompletedHistoryEntry {
  workout: ReturnType<typeof buildExerciseHistory>[number]['workout'];
  sets: Set[];
  bestSetId: Set['id'] | undefined;
}

export interface ExerciseProgressPoint {
  workoutId: string;
  date: number;
  bestWeightKg: number;
  reps: number;
}

export interface ExercisePersonalRecordSummaryItem {
  id: 'best-set' | 'heaviest-weight' | 'most-sets';
  label: string;
  weightKg?: number;
  reps?: number;
  count?: number;
  achievedAt: number;
  isNewRecord: boolean;
}

export interface ExerciseTopSetPerformance {
  id: Set['id'];
  weightKg: number;
  reps: number;
  estimated1rm: number;
  achievedAt: number;
}

function getSetAchievedAt(set: Set, workoutStartedAt: number) {
  return set.completedAt ?? workoutStartedAt;
}

function getLatestAchievedAt(sets: Set[], workoutStartedAt: number) {
  return sets.reduce(
    (latest, set) => Math.max(latest, getSetAchievedAt(set, workoutStartedAt)),
    workoutStartedAt
  );
}

function buildProgressPoints(history: CompletedHistoryEntry[]) {
  return [...history].reverse().map(entry => {
    const bestWeightSet = entry.sets.reduce((best, set) =>
      set.weightKg > best.weightKg ? set : best
    );

    return {
      workoutId: entry.workout.id,
      date: entry.workout.startedAt,
      bestWeightKg: bestWeightSet.weightKg,
      reps: bestWeightSet.reps
    };
  });
}

function buildTopSetPerformances(history: CompletedHistoryEntry[]) {
  return history
    .flatMap(entry =>
      entry.sets.map(set => ({
        id: set.id,
        weightKg: set.weightKg,
        reps: set.reps,
        estimated1rm: computeEstimated1RM(set.weightKg, set.reps),
        achievedAt: getSetAchievedAt(set, entry.workout.startedAt)
      }))
    )
    .sort((left, right) => {
      const estimateDiff = right.estimated1rm - left.estimated1rm;

      if (estimateDiff !== 0) {
        return estimateDiff;
      }

      return right.achievedAt - left.achievedAt;
    })
    .slice(0, 3);
}

function buildPersonalRecordSummary(history: CompletedHistoryEntry[]) {
  const topSets = buildTopSetPerformances(history);
  const bestSet = topSets[0];

  if (!bestSet) {
    return [];
  }

  const heaviestSet = history
    .flatMap(entry =>
      entry.sets.map(set => ({
        set,
        achievedAt: getSetAchievedAt(set, entry.workout.startedAt)
      }))
    )
    .reduce((best, item) => {
      if (item.set.weightKg !== best.set.weightKg) {
        return item.set.weightKg > best.set.weightKg ? item : best;
      }

      return item.achievedAt > best.achievedAt ? item : best;
    });

  const mostSetsWorkout = history.reduce((best, entry) => {
    if (entry.sets.length !== best.sets.length) {
      return entry.sets.length > best.sets.length ? entry : best;
    }

    return entry.workout.startedAt > best.workout.startedAt ? entry : best;
  });

  const latestWorkoutDate = Math.max(
    ...history.map(entry =>
      getLatestAchievedAt(entry.sets, entry.workout.startedAt)
    )
  );

  return [
    {
      id: 'best-set',
      label: 'Best set',
      weightKg: bestSet.weightKg,
      reps: bestSet.reps,
      achievedAt: bestSet.achievedAt,
      isNewRecord: bestSet.achievedAt === latestWorkoutDate
    },
    {
      id: 'heaviest-weight',
      label: 'Heaviest weight',
      weightKg: heaviestSet.set.weightKg,
      achievedAt: heaviestSet.achievedAt,
      isNewRecord: heaviestSet.achievedAt === latestWorkoutDate
    },
    {
      id: 'most-sets',
      label: 'Most sets',
      count: mostSetsWorkout.sets.length,
      achievedAt: getLatestAchievedAt(
        mostSetsWorkout.sets,
        mostSetsWorkout.workout.startedAt
      ),
      isNewRecord:
        getLatestAchievedAt(
          mostSetsWorkout.sets,
          mostSetsWorkout.workout.startedAt
        ) === latestWorkoutDate
    }
  ] satisfies ExercisePersonalRecordSummaryItem[];
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

  const fullHistory = useMemo(
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
        .filter(entry => entry.sets.length > 0),
    [setResult.data, workoutRows]
  );

  const history = useMemo(() => fullHistory.slice(0, 3), [fullHistory]);

  const progressPoints = useMemo(
    () => buildProgressPoints(fullHistory),
    [fullHistory]
  );

  const personalRecordsSummary = useMemo(
    () => buildPersonalRecordSummary(fullHistory),
    [fullHistory]
  );

  const topSetPerformances = useMemo(
    () => buildTopSetPerformances(fullHistory),
    [fullHistory]
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
    progressPoints,
    personalRecordsSummary,
    topSetPerformances,
    primaryMuscles,
    secondaryMuscles,
    instructions,
    mostRecentHistory,
    completedSetSummary,
    weightUnit,
    isLoading: Boolean(exerciseId) && !exerciseResult.isLive
  };
}
