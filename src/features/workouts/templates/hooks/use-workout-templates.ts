import { useDrizzle } from '@/src/providers/database-provider';
import {
  getWorkoutStartTemplateRowsQuery,
  mapWorkoutTemplateRows
} from '@/src/features/workouts/templates/workout-template.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { useMemo } from 'react';

export type { WorkoutStartTemplateItem } from '@/src/features/workouts/templates/workout-template.repository';

interface UseWorkoutTemplatesOptions {
  enabled?: boolean;
  limit?: number;
}

export function useWorkoutTemplates(options?: UseWorkoutTemplatesOptions) {
  const { enabled = true, limit } = options ?? {};
  const db = useDrizzle();
  const result = useLiveWithFallback(
    getWorkoutStartTemplateRowsQuery(db, limit),
    [db, enabled, limit],
    { enabled, operation: 'workoutTemplate.getStartRows' }
  );

  const templates = useMemo(
    () => mapWorkoutTemplateRows(result.data),
    [result.data]
  );

  return {
    templates,
    isLoading: enabled && !result.isLive
  };
}
