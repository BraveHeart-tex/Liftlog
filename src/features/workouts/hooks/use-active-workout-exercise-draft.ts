import type { NewExercise, Workout, WorkoutExercise } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { useSaveActiveWorkoutExerciseDraft } from '@/src/features/workouts/hooks/use-reorder-workout-exercises';
import {
  ActiveWorkoutExerciseDraftConflictError,
  type ActiveWorkoutExerciseDraftBaselineRow,
  type StagedCustomExercise
} from '@/src/features/workouts/workout.repository';
import { generateUuid } from '@/src/lib/utils/uuid.utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface DraftExerciseRow {
  workoutExercise: WorkoutExercise;
  exercise?: ExerciseListItem;
  stagedCustomExercise?: StagedCustomExercise;
}

interface UseActiveWorkoutExerciseDraftParams {
  activeWorkout: Workout;
  workoutExerciseRows: WorkoutExercise[];
  exerciseById: Map<ExerciseListItem['id'], ExerciseListItem>;
  isLoadingWorkoutExercises: boolean;
}

export type SaveActiveWorkoutExerciseDraftResult =
  | { status: 'saved' }
  | { status: 'unchanged' }
  | { status: 'conflict'; error: ActiveWorkoutExerciseDraftConflictError }
  | { status: 'error'; error: unknown };

export function useActiveWorkoutExerciseDraft({
  activeWorkout,
  workoutExerciseRows,
  exerciseById,
  isLoadingWorkoutExercises
}: UseActiveWorkoutExerciseDraftParams) {
  const isSavingRef = useRef(false);
  const [draftExerciseRows, setDraftExerciseRows] =
    useState<DraftExerciseRow[]>();
  const [baselineExerciseRows, setBaselineExerciseRows] =
    useState<ActiveWorkoutExerciseDraftBaselineRow[]>();
  const [isSaving, setIsSaving] = useState(false);
  const saveActiveWorkoutExerciseDraft = useSaveActiveWorkoutExerciseDraft(
    activeWorkout.id
  );

  useEffect(() => {
    if (isLoadingWorkoutExercises || baselineExerciseRows) {
      return;
    }

    setDraftExerciseRows(
      workoutExerciseRows.map(workoutExercise => ({
        workoutExercise
      }))
    );
    setBaselineExerciseRows(
      workoutExerciseRows.map(workoutExercise => ({
        id: workoutExercise.id,
        exerciseId: workoutExercise.exerciseId,
        order: workoutExercise.order,
        supersetId: workoutExercise.supersetId
      }))
    );
  }, [baselineExerciseRows, isLoadingWorkoutExercises, workoutExerciseRows]);

  const hasChanges = useMemo(() => {
    if (!draftExerciseRows || !baselineExerciseRows) {
      return false;
    }

    return (
      draftExerciseRows.length !== baselineExerciseRows.length ||
      draftExerciseRows.some(({ workoutExercise }, order) => {
        const baselineRow = baselineExerciseRows.find(
          baseline => baseline.id === workoutExercise.id
        );

        return (
          !baselineRow ||
          baselineRow.order !== order ||
          baselineRow.exerciseId !== workoutExercise.exerciseId ||
          baselineRow.supersetId !== workoutExercise.supersetId
        );
      })
    );
  }, [baselineExerciseRows, draftExerciseRows]);

  const draftWorkoutExercises = useMemo(
    () =>
      draftExerciseRows?.map(({ workoutExercise }, order) => ({
        ...workoutExercise,
        order
      })) ?? [],
    [draftExerciseRows]
  );

  const draftExerciseById = useMemo(() => {
    const nextExerciseById = new Map(exerciseById);

    for (const row of draftExerciseRows ?? []) {
      if (row.exercise) {
        nextExerciseById.set(row.exercise.id, row.exercise);
      }
    }

    return nextExerciseById;
  }, [draftExerciseRows, exerciseById]);

  const selectedExerciseIds = useMemo(
    () => draftExerciseRows?.map(row => row.workoutExercise.exerciseId) ?? [],
    [draftExerciseRows]
  );

  const stagedCustomExerciseNames = useMemo(
    () =>
      draftExerciseRows
        ?.flatMap(row =>
          row.stagedCustomExercise ? [row.stagedCustomExercise.name] : []
        )
        .filter((name, index, names) => names.indexOf(name) === index) ?? [],
    [draftExerciseRows]
  );

  const changeRows = useCallback(
    (rows: Pick<WorkoutExercise, 'id' | 'supersetId'>[]) => {
      setDraftExerciseRows(currentRows => {
        if (!currentRows) {
          return currentRows;
        }

        const currentRowById = new Map(
          currentRows.map(row => [row.workoutExercise.id, row] as const)
        );

        return rows.flatMap((row, order) => {
          const currentRow = currentRowById.get(row.id);

          return currentRow
            ? [
                {
                  ...currentRow,
                  workoutExercise: {
                    ...currentRow.workoutExercise,
                    order,
                    supersetId: row.supersetId
                  }
                }
              ]
            : [];
        });
      });
    },
    []
  );

  const addExercises = useCallback(
    (exercises: ExerciseListItem[]) => {
      setDraftExerciseRows(currentRows => {
        if (!currentRows) {
          return currentRows;
        }

        const selectedExerciseIdSet = new Set(
          currentRows.map(row => row.workoutExercise.exerciseId)
        );
        const addedExercises = exercises.filter(
          exercise => !selectedExerciseIdSet.has(exercise.id)
        );

        return [
          ...currentRows,
          ...addedExercises.map((exercise, index) => ({
            workoutExercise: {
              id: generateUuid(),
              workoutId: activeWorkout.id,
              exerciseId: exercise.id,
              order: currentRows.length + index,
              supersetId: null,
              notes: null
            },
            exercise
          }))
        ];
      });
    },
    [activeWorkout.id]
  );

  const stageCustomExercise = useCallback(
    (exercise: NewExercise) => {
      const stagedCustomExercise: StagedCustomExercise = {
        id: generateUuid(),
        name: exercise.name,
        category: exercise.category,
        trackingType: exercise.trackingType ?? 'weight_reps',
        primaryMuscles: exercise.primaryMuscles ?? '[]',
        secondaryMuscles: exercise.secondaryMuscles ?? '[]',
        isCustom: 1,
        isArchived: 0,
        createdAt: exercise.createdAt ?? Date.now()
      };

      setDraftExerciseRows(currentRows =>
        currentRows
          ? [
              ...currentRows,
              {
                workoutExercise: {
                  id: generateUuid(),
                  workoutId: activeWorkout.id,
                  exerciseId: stagedCustomExercise.id,
                  order: currentRows.length,
                  supersetId: null,
                  notes: null
                },
                exercise: stagedCustomExercise,
                stagedCustomExercise
              }
            ]
          : currentRows
      );
    },
    [activeWorkout.id]
  );

  const save = useCallback((): SaveActiveWorkoutExerciseDraftResult => {
    if (
      !draftExerciseRows ||
      !baselineExerciseRows ||
      !hasChanges ||
      isSavingRef.current
    ) {
      return { status: 'unchanged' };
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      saveActiveWorkoutExerciseDraft(
        draftExerciseRows.map(row => ({
          id: row.workoutExercise.id,
          exerciseId: row.workoutExercise.exerciseId,
          supersetId: row.workoutExercise.supersetId
        })),
        baselineExerciseRows,
        draftExerciseRows.flatMap(row =>
          row.stagedCustomExercise ? [row.stagedCustomExercise] : []
        )
      );

      return { status: 'saved' };
    } catch (error) {
      isSavingRef.current = false;
      setIsSaving(false);

      return error instanceof ActiveWorkoutExerciseDraftConflictError
        ? { status: 'conflict', error }
        : { status: 'error', error };
    }
  }, [
    baselineExerciseRows,
    draftExerciseRows,
    hasChanges,
    saveActiveWorkoutExerciseDraft
  ]);

  return {
    addExercises,
    changeRows,
    draftExerciseById,
    draftWorkoutExercises,
    hasChanges,
    isInitialized: draftExerciseRows !== undefined,
    isSaving,
    save,
    selectedExerciseIds,
    stageCustomExercise,
    stagedCustomExerciseNames
  };
}
