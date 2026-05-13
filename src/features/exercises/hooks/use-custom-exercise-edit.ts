import { useDrizzle } from '@/src/components/database-provider';
import { getExerciseByIdQuery } from '@/src/features/exercises/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { parseMuscleList } from '@/src/lib/utils/muscle';
import { useMemo } from 'react';

export function useCustomExerciseEdit(exerciseId: string | undefined) {
  const db = useDrizzle();
  const resolvedExerciseId = exerciseId ?? '';
  const exerciseResult = useLiveWithFallback(
    getExerciseByIdQuery(db, resolvedExerciseId),
    [db, resolvedExerciseId]
  );
  const exercise = exerciseResult.data[0];
  const primaryMuscles = useMemo(
    () => parseMuscleList(exercise?.primaryMuscles ?? '[]'),
    [exercise?.primaryMuscles]
  );
  const secondaryMuscles = useMemo(
    () => parseMuscleList(exercise?.secondaryMuscles ?? '[]'),
    [exercise?.secondaryMuscles]
  );

  return {
    exercise,
    primaryMuscles,
    secondaryMuscles,
    isLoading: Boolean(exerciseId) && !exerciseResult.isLive
  };
}
