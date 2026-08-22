import { useDrizzle } from '@/src/components/database-provider';
import { showSnackbar } from '@/src/components/ui/snackbar';
import type { WorkoutTemplate } from '@/src/db/schema';
import {
  createWorkout,
  getActiveWorkoutSummaryQuery
} from '@/src/features/workouts/workout.repository';
import {
  createWorkoutFromTemplate,
  deleteWorkoutTemplate,
  updateWorkoutTemplateName
} from '@/src/features/workouts/workout-template.repository';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer.store';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { triggerHapticMedium } from '@/src/lib/haptics/haptics';
import { withDomainFlowSpan } from '@/src/lib/observability/observability-span';
import { formatWorkoutName } from '@/src/features/workouts/workout-display.utils';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect } from 'react';

const activeWorkoutRoute: Href = '/(tabs)/workout/active';

export function useWorkoutStart() {
  const db = useDrizzle();
  const activeWorkoutResult = useLiveWithFallback(
    getActiveWorkoutSummaryQuery(db),
    [db],
    { operation: 'workout.getActiveWorkoutSummary' }
  );

  const activeWorkoutSummary = activeWorkoutResult.data[0];
  const activeWorkout = activeWorkoutSummary
    ? {
        ...activeWorkoutSummary.workout,
        exerciseCount: activeWorkoutSummary.exerciseCount,
        completedSetCount: activeWorkoutSummary.completedSetCount
      }
    : undefined;
  const activeWorkoutId = activeWorkout?.id;

  useEffect(() => {
    router.prefetch(activeWorkoutRoute);
  }, []);

  const startWorkout = useCallback(() => {
    try {
      withDomainFlowSpan(
        { operation: 'workout.start', feature: 'workout' },
        () => {
          createWorkout(db, {
            name: formatWorkoutName(new Date()),
            status: 'in_progress'
          });
          triggerHapticMedium('workout creation');

          router.navigate(activeWorkoutRoute);
        }
      );
    } catch (error) {
      console.error('Failed to start workout', error);
      showSnackbar({
        message: 'Could not start workout. Please try again.',
        variant: 'danger'
      });
    }
  }, [db]);

  const resumeWorkout = useCallback(() => {
    router.navigate(activeWorkoutRoute);
  }, []);

  const startWorkoutFromTemplate = useCallback(
    (templateId: WorkoutTemplate['id']) => {
      try {
        withDomainFlowSpan(
          { operation: 'workout.start', feature: 'workout' },
          () => {
            const createdWorkout = createWorkoutFromTemplate(db, {
              templateId
            });

            if (!createdWorkout) {
              showSnackbar({
                message: 'This template is no longer available.',
                variant: 'warning'
              });

              return;
            }

            triggerHapticMedium('workout creation');
            router.navigate(activeWorkoutRoute);
          }
        );
      } catch (error) {
        console.error('Failed to start workout from template', error);
        showSnackbar({
          message: 'Could not start workout. Please try again.',
          variant: 'danger'
        });
      }
    },
    [db]
  );

  const discardActiveWorkoutAndStartTemplate = useCallback(
    (templateId: WorkoutTemplate['id']) => {
      try {
        withDomainFlowSpan(
          { operation: 'workout.start', feature: 'workout' },
          () => {
            const createdWorkout = createWorkoutFromTemplate(db, {
              templateId,
              discardWorkoutId: activeWorkoutId
            });

            if (!createdWorkout) {
              showSnackbar({
                message: 'Could not replace workout. Please try again.',
                variant: 'warning'
              });

              return;
            }

            triggerHapticMedium('workout replacement');

            if (activeWorkoutId) {
              useRestTimerStore.getState().cancelForWorkout(activeWorkoutId);
            }

            showSnackbar({
              message: 'Previous workout discarded. New workout started.',
              variant: 'success'
            });
            router.navigate(activeWorkoutRoute);
          }
        );
      } catch (error) {
        console.error('Failed to replace active workout', error);
        showSnackbar({
          message: 'Could not replace workout. Please try again.',
          variant: 'danger'
        });
      }
    },
    [activeWorkoutId, db]
  );

  const renameTemplate = useCallback(
    (templateId: WorkoutTemplate['id'], name: string) =>
      updateWorkoutTemplateName(db, { id: templateId, name }),
    [db]
  );

  const removeTemplate = useCallback(
    (templateId: WorkoutTemplate['id']) =>
      deleteWorkoutTemplate(db, templateId),
    [db]
  );

  return {
    activeWorkout,
    startWorkout,
    resumeWorkout,
    startWorkoutFromTemplate,
    discardActiveWorkoutAndStartTemplate,
    renameTemplate,
    removeTemplate
  };
}
