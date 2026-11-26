import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { resolveTrackingType } from '@/src/features/progress/tracking.domain';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/shared/workout-components.types';
import { WorkoutExerciseSummary } from '@/src/features/workouts/shared/components/workout-exercise-summary';
import { cn } from '@/src/lib/utils/cn.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { iconSizes } from '@/src/theme/sizes';
import { router } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface ActiveWorkoutExerciseCardProps {
  item: WorkoutExerciseWithSets;
  className?: string;
  mode?: 'active' | 'historical' | 'historical-edit';
  variant?: 'default' | 'grouped';
  weightUnit: WeightUnit;
  onLongPress?: () => void;
  pressable?: boolean;
}

export function navigateToWorkoutExercise(
  item: WorkoutExerciseWithSets,
  mode: 'active' | 'historical' | 'historical-edit' = 'active'
) {
  const pathname =
    mode === 'historical'
      ? '/workouts/backfill/exercise/[workoutExerciseId]'
      : mode === 'historical-edit'
        ? '/workouts/edit/exercise/[workoutExerciseId]'
        : '/(tabs)/workout/exercise/[workoutExerciseId]';

  router.navigate({
    pathname,
    params: { workoutExerciseId: item.workoutExercise.id }
  });
}

export function ActiveWorkoutExerciseCard({
  item,
  className,
  mode = 'active',
  variant = 'default',
  weightUnit,
  onLongPress,
  pressable = true
}: ActiveWorkoutExerciseCardProps) {
  const isGrouped = variant === 'grouped';
  const completedSets = item.sets.filter(set => set.status === 'completed');
  const exerciseName = item.exercise?.name ?? 'Unknown exercise';
  const content = isGrouped ? (
    <View className="flex-row items-center gap-3 py-3">
      <WorkoutExerciseSummary
        exerciseName={exerciseName}
        completedSets={completedSets}
        weightUnit={weightUnit}
        trackingType={resolveTrackingType(item.exercise?.trackingType)}
        emptyText="Tap to log sets"
        className="min-w-0 flex-1"
      />
      <Icon as={ChevronRightIcon} size={iconSizes.md} tone="mutedForeground" />
    </View>
  ) : (
    <View className="bg-card">
      <WorkoutExerciseSummary
        exerciseName={exerciseName}
        completedSets={completedSets}
        weightUnit={weightUnit}
        trackingType={resolveTrackingType(item.exercise?.trackingType)}
        emptyText="Tap to log sets"
        className="p-4"
      />
    </View>
  );

  const containerClassName = cn(
    isGrouped
      ? 'bg-transparent'
      : 'border-border bg-card overflow-hidden rounded-lg border',
    className
  );

  if (!pressable) {
    return <View className={containerClassName}>{content}</View>;
  }

  return (
    <PressableSurface
      containerClassName={containerClassName}
      pressedClassName={isGrouped ? 'bg-secondary' : 'opacity-80'}
      pressedScale={isGrouped ? 1 : undefined}
      accessibilityLabel={exerciseName}
      onPress={() => navigateToWorkoutExercise(item, mode)}
      onLongPress={onLongPress}
    >
      {content}
    </PressableSurface>
  );
}
