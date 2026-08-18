import { Icon } from '@/src/components/ui/icon';
import { resolveTrackingType } from '@/src/features/progress/tracking.domain';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/workout-components.types';
import { WorkoutExerciseSummary } from '@/src/features/workouts/components/workout-exercise-summary';
import { usePressScale } from '@/src/lib/animations/use-press-scale.hook';
import { cn } from '@/src/lib/utils/cn.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { iconSizes } from '@/src/theme/sizes';
import { router } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import { Animated, Pressable, View } from 'react-native';

interface ActiveWorkoutExerciseCardProps {
  item: WorkoutExerciseWithSets;
  className?: string;
  mode?: 'active' | 'historical' | 'historical-edit';
  variant?: 'default' | 'grouped';
  weightUnit: WeightUnit;
  onLongPress?: () => void;
}

export function ActiveWorkoutExerciseCard({
  item,
  className,
  mode = 'active',
  variant = 'default',
  weightUnit,
  onLongPress
}: ActiveWorkoutExerciseCardProps) {
  const isGrouped = variant === 'grouped';
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale({
    pressedScale: isGrouped ? 1 : undefined
  });

  const completedSets = item.sets.filter(set => set.status === 'completed');
  const exerciseName = item.exercise?.name ?? 'Unknown exercise';
  const pathname =
    mode === 'historical'
      ? '/workouts/backfill/exercise/[workoutExerciseId]'
      : mode === 'historical-edit'
        ? '/workouts/edit/exercise/[workoutExerciseId]'
        : '/(tabs)/workout/exercise/[workoutExerciseId]';

  return (
    <Animated.View
      style={scaleStyle}
      className={cn(
        isGrouped
          ? 'bg-transparent'
          : 'border-border bg-card overflow-hidden rounded-lg border',
        className
      )}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={exerciseName}
        onPress={() =>
          router.navigate({
            pathname,
            params: { workoutExerciseId: item.workoutExercise.id }
          })
        }
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onLongPress={onLongPress}
      >
        {isGrouped ? (
          <View
            className={cn(
              'flex-row items-center gap-3 py-3',
              pressed && 'bg-secondary'
            )}
          >
            <WorkoutExerciseSummary
              exerciseName={exerciseName}
              completedSets={completedSets}
              weightUnit={weightUnit}
              trackingType={resolveTrackingType(item.exercise?.trackingType)}
              emptyText="Tap to log sets"
              className="min-w-0 flex-1"
            />
            <Icon
              as={ChevronRightIcon}
              size={iconSizes.md}
              tone="mutedForeground"
            />
          </View>
        ) : (
          <View className={cn('bg-card', pressed && 'opacity-80')}>
            <WorkoutExerciseSummary
              exerciseName={exerciseName}
              completedSets={completedSets}
              weightUnit={weightUnit}
              trackingType={resolveTrackingType(item.exercise?.trackingType)}
              emptyText="Tap to log sets"
              className="p-4"
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
