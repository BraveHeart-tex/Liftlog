import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ActiveWorkoutSummaryCard } from '@/src/features/workouts/active/components/active-workout-summary-card';
import { RecentWorkoutsSection } from '@/src/features/workouts/active/components/recent-workouts-section';
import { StartWorkoutSheet } from '@/src/features/workouts/active/components/start-workout-sheet';
import { WorkoutTemplatesSection } from '@/src/features/workouts/templates/components/workout-templates-section';
import { useWorkoutStart } from '@/src/features/workouts/active/hooks/use-workout-start';
import { useWorkoutTemplates } from '@/src/features/workouts/templates/hooks/use-workout-templates';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { useFocusEffect } from 'expo-router';
import { DumbbellIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

export function WorkoutStartScreen() {
  const {
    activeWorkout,
    startWorkout,
    resumeWorkout,
    startWorkoutFromTemplate
  } = useWorkoutStart();
  const { templates, error: templatesError, isLoading } = useWorkoutTemplates();
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [isStartSheetOpen, setIsStartSheetOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsStartingWorkout(false);
    }, [])
  );

  const handleStartWorkout = useCallback(() => {
    if (isStartingWorkout || isLoading) {
      return;
    }

    if (templatesError) {
      showSnackbar({
        message: 'Could not load templates. Please try again.',
        variant: 'danger'
      });

      return;
    }

    if (templates.length > 0) {
      setIsStartSheetOpen(true);

      return;
    }

    setIsStartingWorkout(true);

    if (!startWorkout()) {
      setIsStartingWorkout(false);
    }
  }, [isLoading, isStartingWorkout, startWorkout, templates, templatesError]);

  return (
    <Screen scroll keyboardShouldPersistTaps="handled">
      <Text variant="h1">Workout</Text>

      {activeWorkout && !isStartingWorkout ? (
        <View>
          <ActiveWorkoutSummaryCard
            workout={activeWorkout}
            onPress={resumeWorkout}
          />
        </View>
      ) : (
        <View className="mb-6 gap-4">
          <Button
            className="mt-6 h-14"
            leftIcon={<Icon as={DumbbellIcon} tone="primaryForeground" />}
            fullWidth
            disabled={isStartingWorkout || isLoading}
            loading={isStartingWorkout || isLoading}
            loadingLabel={
              isStartingWorkout ? 'Starting workout...' : 'Loading templates...'
            }
            onPress={handleStartWorkout}
          >
            Start Workout
          </Button>
          <Text tone="muted" variant="caption" className="text-center">
            Log exercises as you go, no setup needed.
          </Text>
        </View>
      )}

      <WorkoutTemplatesSection />
      <RecentWorkoutsSection />

      <StartWorkoutSheet
        isOpen={isStartSheetOpen}
        templates={templates}
        onClose={() => setIsStartSheetOpen(false)}
        onStartEmpty={startWorkout}
        onStartTemplate={startWorkoutFromTemplate}
        onWorkoutStarted={() => setIsStartingWorkout(true)}
      />
    </Screen>
  );
}
