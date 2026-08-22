import { StyledScrollView } from '@/src/components/styled/scroll-view';
import type { Set, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import {
  ActiveWorkoutExerciseCard,
  navigateToWorkoutExercise
} from '@/src/features/workouts/active/components/active-workout-exercise-card';
import { ActiveWorkoutExerciseEditList } from '@/src/features/workouts/active/components/active-workout-exercise-edit-list';
import { SupersetExerciseGroup } from '@/src/features/workouts/shared/components/superset-exercise-group';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/shared/workout-components.types';
import { useActiveWorkoutExerciseList } from '@/src/features/workouts/active/hooks/use-active-workout-exercise-list';
import {
  formatSupersetLabel,
  groupSupersetBlocks
} from '@/src/features/workouts/shared/superset.utils';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { useMemo } from 'react';
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
  sets: Set[];
  exerciseById: Map<ExerciseListItem['id'], ExerciseListItem>;
  mode?: 'active' | 'historical' | 'historical-edit';
  onEnterEditMode?: () => void;
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
  sets,
  exerciseById,
  mode = 'active',
  onEnterEditMode,
  draftExerciseRows,
  onChangeDraftExerciseRows,
  isEditing
}: ActiveWorkoutExerciseListProps) {
  const { weightUnit } = useSettings();
  const reduceMotion = useReducedMotion();
  const shouldAnimateLocalState = mode !== 'active' && !reduceMotion;
  const workoutExerciseById = useMemo(() => {
    if (!isEditing || !draftExerciseRows) {
      return undefined;
    }

    return new Map(
      workoutExercises.map(workoutExercise => [
        workoutExercise.id,
        workoutExercise
      ])
    );
  }, [draftExerciseRows, isEditing, workoutExercises]);
  const visibleWorkoutExercises =
    isEditing && draftExerciseRows
      ? draftExerciseRows
          .map((draftRow, order) => {
            const workoutExercise = workoutExerciseById?.get(draftRow.id);

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
    exerciseById,
    sets
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
        className="min-h-0 flex-1"
        entering={shouldAnimateLocalState ? listEntering : undefined}
        exiting={shouldAnimateLocalState ? listExiting : undefined}
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
      className="min-h-0 flex-1"
      entering={shouldAnimateLocalState ? listEntering : undefined}
      exiting={shouldAnimateLocalState ? listExiting : undefined}
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
            <SupersetExerciseGroup
              key={block.id}
              className="mt-4"
              rows={block.rows}
              supersetLabel={supersetLabel ?? 'Superset'}
              rowInteraction={{
                onPress: row => navigateToWorkoutExercise(row, mode),
                onLongPress: () => onEnterEditMode?.(),
                getAccessibilityLabel: row =>
                  row.exercise?.name ?? 'Unknown exercise'
              }}
              renderRow={({ row }) => (
                <ActiveWorkoutExerciseCard
                  key={row.workoutExercise.id}
                  item={row}
                  mode={mode}
                  variant="grouped"
                  weightUnit={weightUnit}
                  pressable={false}
                  className="flex-1"
                />
              )}
            />
          );
        })}
      </StyledScrollView>
    </Animated.View>
  );
}
