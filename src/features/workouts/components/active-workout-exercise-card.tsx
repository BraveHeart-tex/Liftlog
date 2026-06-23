import { resolveTrackingType } from '@/src/features/progress/tracking';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import type { WeightUnit } from '@/src/lib/utils/weight';
import { router } from 'expo-router';
import { Animated, Pressable, View } from 'react-native';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/types';
import { WorkoutExerciseSummary } from '@/src/features/workouts/components/workout-exercise-summary';

interface ActiveWorkoutExerciseCardProps {
  item: WorkoutExerciseWithSets;
  className?: string;
  mode?: 'active' | 'historical';
  weightUnit: WeightUnit;
  onLongPress: () => void;
}

export function ActiveWorkoutExerciseCard({
  item,
  className,
  mode = 'active',
  weightUnit,
  onLongPress
}: ActiveWorkoutExerciseCardProps) {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  const completedSets = item.sets.filter(set => set.status === 'completed');

  return (
    <Animated.View
      style={scaleStyle}
      className={cn(
        'border-border bg-card overflow-hidden rounded-lg border',
        className
      )}
    >
      <Pressable
        onPress={() =>
          router.push({
            pathname:
              mode === 'historical'
                ? '/workouts/backfill/exercise/[workoutExerciseId]'
                : '/(tabs)/workout/exercise/[workoutExerciseId]',
            params: { workoutExerciseId: item.workoutExercise.id }
          })
        }
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onLongPress={onLongPress}
      >
        <View className={cn('bg-card', pressed && 'opacity-80')}>
          <WorkoutExerciseSummary
            exerciseName={item.exercise?.name ?? 'Unknown exercise'}
            completedSets={completedSets}
            weightUnit={weightUnit}
            trackingType={resolveTrackingType(item.exercise?.trackingType)}
            emptyText="Tap to log sets"
            className="p-4"
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}
