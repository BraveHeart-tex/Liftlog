import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import { createHistoricalWorkoutEditDraft } from '@/src/features/workouts/workout.repository';
import { router } from 'expo-router';
import { useCallback } from 'react';

export function useHistoricalWorkoutEditStart() {
  const db = useDrizzle();

  return useCallback(
    (sourceWorkoutId: Workout['id']) => {
      const draftWorkout = createHistoricalWorkoutEditDraft(
        db,
        sourceWorkoutId
      );

      if (!draftWorkout) {
        return undefined;
      }

      router.navigate(
        {
          pathname: '/workouts/edit/[id]',
          params: {
            id: draftWorkout.id,
            sourceWorkoutId
          }
        },
        {
          dangerouslySingular: (_name, params) =>
            `workouts/edit/${params.sourceWorkoutId ?? params.id}`
        }
      );

      return draftWorkout;
    },
    [db]
  );
}
