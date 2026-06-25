import { useDrizzle } from '@/src/components/database-provider';
import type { Set } from '@/src/db/schema';
import type {
  ExercisePersonalRecordSummaryItem,
  ExerciseProgressPoint,
  ExerciseTopSetPerformance
} from '@/src/features/exercises/exercise.types';
import {
  getExerciseByIdQuery,
  getExerciseTemplateUsageCountQuery,
  getExerciseUsageCountQuery
} from '@/src/features/exercises/repository';
import {
  buildExerciseHistory,
  getExerciseHistorySetsQuery,
  getRecentExerciseHistoryWorkoutsQuery
} from '@/src/features/progress/repository';
import {
  TRACKING_TYPE_DEFINITIONS,
  formatScore,
  formatTrackingValue,
  getSetScore,
  getSetValues,
  resolveTrackingType,
  type TrackingType
} from '@/src/features/progress/tracking';
import { useSettings } from '@/src/features/settings/hooks';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { parseMuscleList } from '@/src/lib/utils/muscle';
import { formatCompletedSets } from '@/src/lib/utils/set';
import { useMemo } from 'react';

const EXERCISE_HISTORY_LIMIT = 20;

function getBestSetId(sets: Set[], trackingType: TrackingType) {
  if (sets.length === 0) {
    return undefined;
  }

  return sets.reduce<{ set: Set; score: number } | null>((best, set) => {
    const score = getSetScore(trackingType, set);

    if (score === null) {
      return best;
    }

    if (!best || score > best.score) {
      return { set, score };
    }

    return best;
  }, null)?.set.id;
}

interface CompletedHistoryEntry {
  workout: ReturnType<typeof buildExerciseHistory>[number]['workout'];
  sets: Set[];
  bestSetId: Set['id'] | undefined;
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

function buildProgressPoints(
  history: CompletedHistoryEntry[],
  trackingType: TrackingType,
  weightUnit: ReturnType<typeof useSettings>['weightUnit']
): ExerciseProgressPoint[] {
  return [...history].reverse().flatMap(entry => {
    const bestSet = entry.sets.reduce<{ set: Set; score: number } | null>(
      (best, set) => {
        const score = getSetScore(trackingType, set);

        if (score === null) {
          return best;
        }

        if (!best || score > best.score) {
          return { set, score };
        }

        return best;
      },
      null
    );

    if (!bestSet) {
      return [];
    }

    return {
      workoutId: entry.workout.id,
      date: entry.workout.startedAt,
      value: bestSet.score,
      valueLabel: formatScore(trackingType, bestSet.score, weightUnit)
    };
  });
}

function buildTopSetPerformances(
  history: CompletedHistoryEntry[],
  trackingType: TrackingType,
  weightUnit: ReturnType<typeof useSettings>['weightUnit']
) {
  return history
    .flatMap(entry =>
      entry.sets.flatMap(set => {
        const score = getSetScore(trackingType, set);

        if (score === null) {
          return [];
        }

        return {
          id: set.id,
          value: formatTrackingValue(
            trackingType,
            getSetValues(set),
            weightUnit
          ),
          score,
          scoreLabel: `${TRACKING_TYPE_DEFINITIONS[trackingType].scoreLabel} ${formatScore(
            trackingType,
            score,
            weightUnit
          )}`,
          achievedAt: getSetAchievedAt(set, entry.workout.startedAt)
        };
      })
    )
    .sort((left, right) => {
      const estimateDiff = right.score - left.score;

      if (estimateDiff !== 0) {
        return estimateDiff;
      }

      return right.achievedAt - left.achievedAt;
    })
    .slice(0, 3);
}

function buildPersonalRecordSummary(
  history: CompletedHistoryEntry[],
  topSets: ExerciseTopSetPerformance[]
) {
  const bestSet = topSets[0];

  if (!bestSet) {
    return [];
  }

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
      value: bestSet.value,
      achievedAt: bestSet.achievedAt,
      isNewRecord: bestSet.achievedAt === latestWorkoutDate
    },
    {
      id: 'most-sets',
      label: 'Most sets',
      count: mostSetsWorkout.sets.length,
      value:
        mostSetsWorkout.sets.length === 1
          ? '1 set'
          : `${mostSetsWorkout.sets.length} sets`,
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
    getExerciseByIdQuery(db, resolvedExerciseId),
    [db, resolvedExerciseId]
  );
  const exercise = exerciseResult.data[0];
  const trackingType = resolveTrackingType(exercise?.trackingType);
  const hasExercise = Boolean(exercise);
  const isCustomExercise = exercise?.isCustom === 1;

  const exerciseUsageResult = useLiveWithFallback(
    getExerciseUsageCountQuery(db, resolvedExerciseId),
    [db, resolvedExerciseId, isCustomExercise],
    { enabled: isCustomExercise }
  );

  const templateUsageResult = useLiveWithFallback(
    getExerciseTemplateUsageCountQuery(db, resolvedExerciseId),
    [db, resolvedExerciseId, isCustomExercise],
    { enabled: isCustomExercise }
  );

  const workoutResult = useLiveWithFallback(
    getRecentExerciseHistoryWorkoutsQuery(
      db,
      resolvedExerciseId,
      EXERCISE_HISTORY_LIMIT
    ),
    [db, resolvedExerciseId, hasExercise],
    {
      deferInitialRead: true,
      enabled: hasExercise,
      waitForInteractions: true
    }
  );

  const workoutRows = workoutResult.data;
  const workoutIds = useMemo(
    () => Array.from(new Set(workoutRows.map(row => row.workout.id))),
    [workoutRows]
  );

  const workoutIdKey = useMemo(() => workoutIds.join(','), [workoutIds]);

  const setResult = useLiveWithFallback(
    getExerciseHistorySetsQuery(db, resolvedExerciseId, workoutIds),
    [db, resolvedExerciseId, workoutIdKey],
    {
      deferInitialRead: true,
      enabled: hasExercise && workoutIds.length > 0,
      waitForInteractions: true
    }
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
            bestSetId: getBestSetId(completedSets, trackingType)
          };
        })
        .filter(entry => entry.sets.length > 0),
    [setResult.data, trackingType, workoutRows]
  );

  const history = useMemo(() => fullHistory.slice(0, 3), [fullHistory]);

  const progressPoints = useMemo(
    () => buildProgressPoints(fullHistory, trackingType, weightUnit),
    [fullHistory, trackingType, weightUnit]
  );

  const topSetPerformances = useMemo(
    () => buildTopSetPerformances(fullHistory, trackingType, weightUnit),
    [fullHistory, trackingType, weightUnit]
  );

  const personalRecordsSummary = useMemo(
    () => buildPersonalRecordSummary(fullHistory, topSetPerformances),
    [fullHistory, topSetPerformances]
  );

  const primaryMuscles = useMemo(
    () => parseMuscleList(exercise?.primaryMuscles ?? '[]'),
    [exercise?.primaryMuscles]
  );

  const secondaryMuscles = useMemo(
    () => parseMuscleList(exercise?.secondaryMuscles ?? '[]'),
    [exercise?.secondaryMuscles]
  );

  const mostRecentHistory = fullHistory[0];

  const completedSets = mostRecentHistory?.sets ?? [];

  const completedSetSummary = formatCompletedSets(
    completedSets,
    weightUnit,
    trackingType
  );

  return {
    exercise,
    exerciseUsageCount:
      (exerciseUsageResult.data[0]?.count ?? 0) +
      (templateUsageResult.data[0]?.count ?? 0),
    workoutUsageCount: exerciseUsageResult.data[0]?.count ?? 0,
    templateUsageCount: templateUsageResult.data[0]?.count ?? 0,
    history,
    progressPoints,
    personalRecordsSummary,
    topSetPerformances,
    primaryMuscles,
    secondaryMuscles,
    mostRecentHistory,
    completedSetSummary,
    weightUnit,
    trackingType,
    isLoading: Boolean(exerciseId) && !exercise && !exerciseResult.isLive,
    isStatsLoading:
      hasExercise &&
      (!workoutResult.isLive || (workoutIds.length > 0 && !setResult.isLive))
  };
}
