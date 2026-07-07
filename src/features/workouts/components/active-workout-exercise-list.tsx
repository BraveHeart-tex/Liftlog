import { StyledScrollView } from '@/src/components/styled/scroll-view';
import type { WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { ActiveWorkoutExerciseCard } from '@/src/features/workouts/components/active-workout-exercise-card';
import { ActiveWorkoutExerciseEditList } from '@/src/features/workouts/components/active-workout-exercise-edit-list';
import { SupersetIndicator } from '@/src/features/workouts/components/superset-indicator';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/workout-components.types';
import { useActiveWorkoutExerciseList } from '@/src/features/workouts/hooks/use-active-workout-exercise-list';
import {
  formatSupersetLabel,
  groupSupersetBlocks
} from '@/src/features/workouts/superset.utils';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useMemo } from 'react';
import { View } from 'react-native';
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
  draftExerciseRows?: Pick<WorkoutExercise, 'id' | 'supersetId'>[];
  onChangeDraftExerciseRows: (
    rows: Pick<WorkoutExercise, 'id' | 'supersetId'>[]
  ) => void;
  isEditing: boolean;
}

type DisplayWorkoutExerciseRow = WorkoutExerciseWithSets & {
  id: WorkoutExercise['id'];
  supersetId: WorkoutExercise['supersetId'];
};

export function ActiveWorkoutExerciseList({
  workoutExercises,
  exerciseById,
  mode = 'active',
  onEnterEditMode,
  draftExerciseRows,
  onChangeDraftExerciseRows,
  isEditing
}: ActiveWorkoutExerciseListProps) {
  const { weightUnit } = useSettings();
  const visibleWorkoutExercises =
    isEditing && draftExerciseRows
      ? draftExerciseRows
          .map((draftRow, order) => {
            const workoutExercise = workoutExercises.find(
              row => row.id === draftRow.id
            );

            return workoutExercise
              ? { ...workoutExercise, order, supersetId: draftRow.supersetId }
              : undefined;
          })
          .filter(
            (workoutExercise): workoutExercise is WorkoutExercise =>
              workoutExercise !== undefined
          )
      : workoutExercises;
  const workoutExercisesWithSets = useActiveWorkoutExerciseList({
    workoutExercises: visibleWorkoutExercises,
    exerciseById
  });
  const supersetBlocks = useMemo(
    () =>
      groupSupersetBlocks<DisplayWorkoutExerciseRow>(
        workoutExercisesWithSets.map(row => ({
          ...row,
          id: row.workoutExercise.id,
          supersetId: row.workoutExercise.supersetId
        }))
      ),
    [workoutExercisesWithSets]
  );
  const supersetLabelByBlockId = useMemo(() => {
    let supersetIndex = 0;

    return new Map(
      supersetBlocks
        .filter(block => block.supersetId)
        .map(block => [block.id, formatSupersetLabel(supersetIndex++)])
    );
  }, [supersetBlocks]);

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
          onChangeRows={onChangeDraftExerciseRows}
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
        {supersetBlocks.map(block => {
          if (!block.supersetId) {
            const workoutExercise = block.rows[0];

            return (
              <ActiveWorkoutExerciseCard
                key={workoutExercise.workoutExercise.id}
                item={workoutExercise}
                mode={mode}
                weightUnit={weightUnit}
                className="mt-4"
                onLongPress={onEnterEditMode}
              />
            );
          }

          const supersetLabel = supersetLabelByBlockId.get(block.id);

          return (
            <View key={block.id} className="mt-4">
              <ActiveWorkoutExerciseCard
                item={block.rows[0]}
                mode={mode}
                supersetLabel={supersetLabel}
                weightUnit={weightUnit}
                onLongPress={onEnterEditMode}
              />

              <SupersetIndicator />

              <ActiveWorkoutExerciseCard
                item={block.rows[1]}
                mode={mode}
                supersetLabel={supersetLabel}
                weightUnit={weightUnit}
                onLongPress={onEnterEditMode}
              />
            </View>
          );
        })}
      </StyledScrollView>
    </Animated.View>
  );
}
