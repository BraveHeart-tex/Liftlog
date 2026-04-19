import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import type { Exercise, Workout } from '@/src/db/schema';
import {
  useActiveWorkoutActions,
  useActiveWorkoutContent as useActiveWorkoutContentData
} from '@/src/features/workouts/hooks';
import { ActiveWorkoutExerciseList } from '@/src/features/workouts/components/active-workout-exercise-list';
import { EmptyExerciseState } from '@/src/features/workouts/components/empty-exercise-state';
import { ExercisePickerSheet } from '@/src/features/workouts/components/exercise-picker-sheet';
import { RestTimerSheet } from '@/src/features/workouts/components/rest-timer-sheet';
import { formatDuration } from '@/src/lib/utils/date';
import { PlusIcon, TimerIcon } from 'lucide-react-native';
import { View } from 'react-native';

type ActiveWorkoutContentProps = {
  activeWorkout: Workout;
  exerciseRows: Exercise[];
};

export function ActiveWorkoutContent({
  activeWorkout,
  exerciseRows
}: ActiveWorkoutContentProps) {
  const {
    now,
    isExercisePickerOpen,
    setIsExercisePickerOpen,
    isRestTimerOpen,
    setIsRestTimerOpen,
    workoutExerciseRows,
    isLoadingWorkoutExercises,
    exerciseById,
    isRestTimerRunning
  } = useActiveWorkoutContentData({ activeWorkout, exerciseRows });
  const { finishWorkout, selectExercise } = useActiveWorkoutActions({
    activeWorkout,
    workoutExerciseRows,
    isLoadingWorkoutExercises,
    setIsExercisePickerOpen
  });

  return (
    <Screen withPadding={false}>
      <View className="flex-row items-center justify-between gap-4 px-4 pt-4 pb-2">
        <BackButton />

        <Text variant="h2" className="flex-1" numberOfLines={1}>
          {activeWorkout.name}
        </Text>

        <Button
          variant="ghost"
          size="icon"
          onPress={() => setIsRestTimerOpen(true)}
        >
          <Icon icon={TimerIcon} size={20} className="text-foreground" />
          {isRestTimerRunning ? (
            <View className="bg-primary absolute top-0 right-0 h-2 w-2 rounded-full" />
          ) : null}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={
            isLoadingWorkoutExercises || workoutExerciseRows.length === 0
          }
          onPress={finishWorkout}
        >
          Finish
        </Button>
      </View>

      <View className="px-4 pb-3">
        <Text variant="caption" tone="muted">
          {formatDuration({
            startedAt: activeWorkout.startedAt,
            completedAt: now
          })}
        </Text>
      </View>

      <StyledScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-4 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoadingWorkoutExercises ? (
          <LoadingState label="Loading exercises..." />
        ) : workoutExerciseRows.length > 0 ? (
          <ActiveWorkoutExerciseList
            workoutExercises={workoutExerciseRows}
            exerciseById={exerciseById}
          />
        ) : (
          <EmptyExerciseState
            onAddExercise={() => setIsExercisePickerOpen(true)}
          />
        )}
      </StyledScrollView>

      <View className="border-border bg-background border-t px-4 py-4">
        <Button
          variant="secondary"
          className="w-full"
          disabled={isLoadingWorkoutExercises}
          leftIcon={
            <Icon icon={PlusIcon} size={16} className="text-foreground" />
          }
          onPress={() => setIsExercisePickerOpen(true)}
        >
          Add exercise
        </Button>
      </View>

      <ExercisePickerSheet
        isOpen={isExercisePickerOpen}
        exercises={exerciseRows}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelectExercise={selectExercise}
      />

      <RestTimerSheet
        isOpen={isRestTimerOpen}
        onClose={() => setIsRestTimerOpen(false)}
      />
    </Screen>
  );
}
