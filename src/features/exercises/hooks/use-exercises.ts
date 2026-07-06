import { useDrizzle } from '@/src/components/database-provider';
import { getExercisesQuery } from '@/src/features/exercises/exercise.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';

interface UseExercisesOptions {
  enabled?: boolean;
}

export const useExercises = (options?: UseExercisesOptions) => {
  const { enabled = true } = options ?? {};
  const db = useDrizzle();
  const result = useLiveWithFallback(getExercisesQuery(db), [db, enabled], {
    enabled,
    fallbackData: [],
    deferInitialRead: true
  });

  return {
    exercises: result.data,
    isLoading: enabled && !result.isLive && !result.error
  };
};
