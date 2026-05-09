import { Text } from '@/src/components/ui/text';
import { useSettings } from '@/src/features/settings/hooks';
import { useRemoveWorkoutExercise } from '@/src/features/workouts/hooks';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Animated, Pressable, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { WorkoutExerciseWithSets } from './types';
import { WorkoutExerciseSummary } from './workout-exercise-summary';

interface ExerciseCardProps {
  item: WorkoutExerciseWithSets;
  className?: string;
}

export function ExerciseCard({ item, className }: ExerciseCardProps) {
  const { weightUnit } = useSettings();
  const removeWorkoutExercise = useRemoveWorkoutExercise();
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();
  const [isDeleteActionHidden, setIsDeleteActionHidden] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const completedSets = item.sets.filter(set => set.status === 'completed');

  const handleCardPressIn = () => {
    if (isSwiping) {
      return;
    }

    onPressIn();
  };

  const handleSwipeStart = () => {
    setIsSwiping(true);
    onPressOut();
  };

  const handleSwipeEnd = () => {
    setIsSwiping(false);
    onPressOut();
  };

  const handleRemoveExercise = () => {
    const exerciseName = item.exercise?.name ?? 'Unknown exercise';
    const setCount = item.sets.length;
    const completedSetCount = completedSets.length;
    const selectedDetails =
      setCount > 0
        ? `${exerciseName}\n${setCount} sets logged, ${completedSetCount} completed.`
        : `${exerciseName}\nNo sets logged yet.`;

    setIsSelected(true);

    Alert.alert(
      'Remove exercise?',
      `${selectedDetails}\n\nThis will delete all sets for this exercise.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setIsDeleteActionHidden(false);
            setIsSelected(false);
          }
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setIsDeleteActionHidden(false);
            setIsSelected(false);
            removeWorkoutExercise(item.workoutExercise.id);
          }
        }
      ],
      {
        onDismiss: () => {
          setIsDeleteActionHidden(false);
          setIsSelected(false);
        }
      }
    );
  };

  const renderDeleteAction = (
    _progress: unknown,
    _translation: unknown,
    swipeable: SwipeableMethods
  ) => (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'bg-danger h-full min-w-24 items-center justify-center px-4',
        isDeleteActionHidden && 'opacity-0'
      )}
      onPressIn={() => setIsDeleteActionHidden(true)}
      onPress={() => {
        swipeable.close();
        handleRemoveExercise();
      }}
    >
      <Text variant="bodyMedium" className="text-primary-foreground">
        Remove
      </Text>
    </Pressable>
  );

  return (
    <View
      className={cn(
        'border-border bg-card overflow-hidden rounded-lg border',
        isSelected && 'border-primary',
        className
      )}
    >
      <ReanimatedSwipeable
        overshootRight={false}
        containerStyle={{ borderRadius: 8, overflow: 'hidden' }}
        onSwipeableOpenStartDrag={handleSwipeStart}
        onSwipeableCloseStartDrag={handleSwipeStart}
        onSwipeableOpen={handleSwipeEnd}
        onSwipeableClose={() => {
          setIsDeleteActionHidden(false);
          handleSwipeEnd();
        }}
        renderRightActions={renderDeleteAction}
      >
        <Animated.View style={scaleStyle}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/workout/exercise/[workoutExerciseId]',
                params: { workoutExerciseId: item.workoutExercise.id }
              })
            }
            onPressIn={handleCardPressIn}
            onPressOut={onPressOut}
          >
            <View
              className={cn(
                'bg-card',
                pressed && 'opacity-80',
                isSelected && 'bg-muted/50'
              )}
            >
              <WorkoutExerciseSummary
                exerciseName={item.exercise?.name ?? 'Unknown exercise'}
                completedSets={completedSets}
                weightUnit={weightUnit}
                emptyText="Tap to log sets"
                className="p-4"
              />
            </View>
          </Pressable>
        </Animated.View>
      </ReanimatedSwipeable>
    </View>
  );
}
