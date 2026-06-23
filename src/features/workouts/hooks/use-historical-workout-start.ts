import { useDrizzle } from '@/src/components/database-provider';
import type { WorkoutTemplate } from '@/src/db/schema';
import {
  createHistoricalWorkoutDraft,
  createHistoricalWorkoutDraftFromTemplate
} from '@/src/features/workouts/repository';
import { useWorkoutTemplates } from '@/src/features/workouts/hooks/use-workout-templates';
import { router } from 'expo-router';
import { useCallback } from 'react';

interface UseHistoricalWorkoutStartOptions {
  enabled?: boolean;
}

export function useHistoricalWorkoutStart(
  dateKey: string,
  options?: UseHistoricalWorkoutStartOptions
) {
  const { enabled = true } = options ?? {};
  const db = useDrizzle();
  const { templates, isLoading } = useWorkoutTemplates({ enabled });

  const openDraft = useCallback((workoutId: string) => {
    router.push({
      pathname: '/workouts/backfill/[id]',
      params: { id: workoutId }
    });
  }, []);

  const startBlankWorkout = useCallback(() => {
    const draft = createHistoricalWorkoutDraft(db, dateKey);

    openDraft(draft.id);
  }, [dateKey, db, openDraft]);

  const startWorkoutFromTemplate = useCallback(
    (templateId: WorkoutTemplate['id']) => {
      const draft = createHistoricalWorkoutDraftFromTemplate(db, {
        dateKey,
        templateId
      });

      if (draft) {
        openDraft(draft.id);
      }
    },
    [dateKey, db, openDraft]
  );

  return {
    templates,
    startBlankWorkout,
    startWorkoutFromTemplate,
    isLoading
  };
}
