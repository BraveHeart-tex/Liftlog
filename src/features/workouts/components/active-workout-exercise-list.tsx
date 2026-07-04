import { StyledScrollView } from '@/src/components/styled/scroll-view';
import type { WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { useSettings } from '@/src/features/settings/hooks';
import { useActiveWorkoutExerciseList } from '@/src/features/workouts/hooks';
import { ActiveWorkoutExerciseCard } from '@/src/features/workouts/components/active-workout-exercise-card';
import { ActiveWorkoutExerciseEditList } from '@/src/features/workouts/components/active-workout-exercise-edit-list';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion';
import Animated, { Keyframe } from 'react-native-reanimated';

const listEntering = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: 10 }]
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }]
  }
}).duration(MOTION_DURATION_MS.standard);

const listExiting = new Keyframe({
  0: {
    opacity: 1,
    transform: [{ translateY: 0 }]
  },
  100: {
    opacity: 0,
    transform: [{ translateY: -8 }]
  }
}).duration(MOTION_DURATION_MS.exit);

interface ActiveWorkoutExerciseListProps {
  workoutExercises: WorkoutExercise[];
  exerciseById: Map<ExerciseListItem['id'], ExerciseListItem>;
  mode?: 'active' | 'historical' | 'historical-edit';
  onEnterEditMode: () => void;
  onReorderExercises: (
    orderedWorkoutExerciseIds: WorkoutExercise['id'][]
  ) => boolean;
  isEditing: boolean;
}

export function ActiveWorkoutExerciseList({
  workoutExercises,
  exerciseById,
  mode = 'active',
  onEnterEditMode,
  onReorderExercises,
  isEditing
}: ActiveWorkoutExerciseListProps) {
  const { weightUnit } = useSettings();
  const workoutExercisesWithSets = useActiveWorkoutExerciseList({
    workoutExercises,
    exerciseById
  });

  if (isEditing) {
    return (
      <Animated.View
        key="edit-exercise-list"
        className="flex-1"
        entering={listEntering}
        exiting={listExiting}
      >
        <ActiveWorkoutExerciseEditList
          rows={workoutExercisesWithSets}
          onReorderExercises={onReorderExercises}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      key="workout-exercise-card-list"
      className="flex-1"
      entering={listEntering}
      exiting={listExiting}
    >
      <StyledScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-4 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {workoutExercisesWithSets.map(workoutExercise => (
          <ActiveWorkoutExerciseCard
            key={workoutExercise.workoutExercise.id}
            item={workoutExercise}
            mode={mode}
            weightUnit={weightUnit}
            className="mt-4"
            onLongPress={onEnterEditMode}
          />
        ))}
      </StyledScrollView>
    </Animated.View>
  );
}
