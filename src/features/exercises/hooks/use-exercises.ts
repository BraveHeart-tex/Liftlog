import { useDrizzle } from '@/src/components/database-provider';
import { getExercisesQuery } from '@/src/features/exercises/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';

export const useExercises = () => {
  const db = useDrizzle();
  const { data: exercises } = useLiveWithFallback(getExercisesQuery(db), [db]);

  return exercises;
};
