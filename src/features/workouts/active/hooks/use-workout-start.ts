import { useDrizzle } from '@/src/providers/database-provider';
import { showSnackbar } from '@/src/components/ui/snackbar';
import type { WorkoutTemplate } from '@/src/db/schema';
import {
  createWorkout,
  getActiveWorkoutSummaryQuery
} from '@/src/features/workouts/active/active.repository';
import {
  createWorkoutFromTemplate,
  deleteWorkoutTemplate,
  updateWorkoutTemplateName
} from '@/src/features/workouts/templates/workout-template.repository';
import { useRestTimerStore } from '@/src/features/rest-timer/rest-timer.store';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { triggerHapticMedium } from '@/src/lib/haptics/haptics';
import { withDomainFlowSpan } from '@/src/lib/observability/observability-span';
import { formatWorkoutName } from '@/src/features/workouts/shared/workout-display.utils';
import {
  canStartWorkout,
  canCreateWorkout
} from '@/src/features/app-updates/workout-update-exclusion';
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
    if (!canStartWorkout(db)) {
      showSnackbar({
        message: 'Finish the active workout before updating.',
        variant: 'warning'
      });

      return false;
    }

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

      return true;
    } catch (error) {
      console.error('Failed to start workout', error);
      showSnackbar({
        message: 'Could not start workout. Please try again.',
        variant: 'danger'
      });

      return false;
    }
  }, [db]);

  const resumeWorkout = useCallback(() => {
    router.navigate(activeWorkoutRoute);
  }, []);

  const startWorkoutFromTemplate = useCallback(
    (templateId: WorkoutTemplate['id']) => {
      if (!canStartWorkout(db)) {
        showSnackbar({
          message: 'Finish the active workout before updating.',
          variant: 'warning'
        });

        return;
      }

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
      if (!canCreateWorkout(db)) {
        showSnackbar({
          message: 'Finish the active workout before updating.',
          variant: 'warning'
        });

        return;
      }

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
