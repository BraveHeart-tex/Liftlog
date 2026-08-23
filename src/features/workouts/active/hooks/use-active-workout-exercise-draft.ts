import type { NewExercise, Workout, WorkoutExercise } from '@/src/db/schema';
import { normalizeExerciseName } from '@/src/features/exercises/exercise-name.utils';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { useSaveActiveWorkoutExerciseDraft } from '@/src/features/workouts/active/hooks/use-reorder-workout-exercises';
import {
  ActiveWorkoutExerciseDraftConflictError,
  type ActiveWorkoutExerciseDraftBaselineRow,
  type StagedCustomExercise
} from '@/src/features/workouts/active/active.repository';
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

type SaveActiveWorkoutExerciseDraftResult =
  | { status: 'saved' }
  | { status: 'unchanged' }
  | { status: 'conflict'; error: ActiveWorkoutExerciseDraftConflictError }
  | { status: 'error'; error: unknown };

function matchesBaseline(
  rows: DraftExerciseRow[],
  baselineRows: ActiveWorkoutExerciseDraftBaselineRow[]
) {
  if (rows.length !== baselineRows.length) {
    return false;
  }

  return rows.every(({ workoutExercise }, order) => {
    const baselineRow = baselineRows[order];

    return (
      baselineRow?.id === workoutExercise.id &&
      baselineRow.exerciseId === workoutExercise.exerciseId &&
      baselineRow.order === order &&
      baselineRow.supersetId === workoutExercise.supersetId
    );
  });
}

function areDraftRowsEqual(
  firstRows: DraftExerciseRow[],
  secondRows: DraftExerciseRow[]
) {
  if (firstRows.length !== secondRows.length) {
    return false;
  }

  return firstRows.every((firstRow, index) => {
    const secondRow = secondRows[index];

    return (
      secondRow?.workoutExercise.id === firstRow.workoutExercise.id &&
      secondRow.workoutExercise.exerciseId ===
        firstRow.workoutExercise.exerciseId &&
      secondRow.workoutExercise.supersetId ===
        firstRow.workoutExercise.supersetId &&
      Boolean(secondRow.stagedCustomExercise) ===
        Boolean(firstRow.stagedCustomExercise)
    );
  });
}

export function useActiveWorkoutExerciseDraft({
  activeWorkout,
  workoutExerciseRows,
  exerciseById,
  isLoadingWorkoutExercises
}: UseActiveWorkoutExerciseDraftParams) {
  const isSavingRef = useRef(false);
  const draftExerciseRowsRef = useRef<DraftExerciseRow[]>([]);
  const baselineExerciseRowsRef = useRef<
    ActiveWorkoutExerciseDraftBaselineRow[]
  >([]);
  const [draftExerciseRows, setDraftExerciseRows] =
    useState<DraftExerciseRow[]>();
  const [baselineExerciseRows, setBaselineExerciseRows] =
    useState<ActiveWorkoutExerciseDraftBaselineRow[]>();
  const [changeCount, setChangeCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const saveActiveWorkoutExerciseDraft = useSaveActiveWorkoutExerciseDraft(
    activeWorkout.id
  );

  useEffect(() => {
    if (isLoadingWorkoutExercises || baselineExerciseRows) {
      return;
    }

    const initialDraftRows = workoutExerciseRows.map(workoutExercise => ({
      workoutExercise
    }));
    const initialBaselineRows = workoutExerciseRows.map(workoutExercise => ({
      id: workoutExercise.id,
      exerciseId: workoutExercise.exerciseId,
      order: workoutExercise.order,
      supersetId: workoutExercise.supersetId
    }));

    draftExerciseRowsRef.current = initialDraftRows;
    baselineExerciseRowsRef.current = initialBaselineRows;
    setDraftExerciseRows(initialDraftRows);
    setBaselineExerciseRows(initialBaselineRows);
  }, [baselineExerciseRows, isLoadingWorkoutExercises, workoutExerciseRows]);

  const hasChanges = useMemo(() => {
    if (!draftExerciseRows || !baselineExerciseRows) {
      return false;
    }

    return !matchesBaseline(draftExerciseRows, baselineExerciseRows);
  }, [baselineExerciseRows, draftExerciseRows]);

  const applyDraftRows = useCallback((nextRows: DraftExerciseRow[]) => {
    const currentRows = draftExerciseRowsRef.current;

    if (!currentRows || areDraftRowsEqual(currentRows, nextRows)) {
      return;
    }

    draftExerciseRowsRef.current = nextRows;
    setDraftExerciseRows(nextRows);

    const currentBaselineRows = baselineExerciseRowsRef.current;

    setChangeCount(currentCount =>
      currentBaselineRows && matchesBaseline(nextRows, currentBaselineRows)
        ? 0
        : currentCount + 1
    );
  }, []);

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
      const currentRows = draftExerciseRowsRef.current;

      if (!currentRows) {
        return;
      }

      const currentRowById = new Map(
        currentRows.map(row => [row.workoutExercise.id, row] as const)
      );
      const nextRows = rows.flatMap((row, order) => {
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

      applyDraftRows(nextRows);
    },
    [applyDraftRows]
  );

  const addExercises = useCallback(
    (exercises: ExerciseListItem[]) => {
      const currentRows = draftExerciseRowsRef.current;

      if (!currentRows) {
        return;
      }

      const selectedExerciseIdSet = new Set(
        currentRows.map(row => row.workoutExercise.exerciseId)
      );
      const addedExercises = exercises.filter(
        exercise => !selectedExerciseIdSet.has(exercise.id)
      );

      applyDraftRows([
        ...currentRows,
        ...addedExercises.map((exercise, index) => ({
          workoutExercise: {
            id: generateUuid(),
            workoutId: activeWorkout.id,
            exerciseId: exercise.id,
            order: currentRows.length + index,
            supersetId: null,
            notes: null,
            sourceWorkoutExerciseId: null
          },
          exercise
        }))
      ]);
    },
    [activeWorkout.id, applyDraftRows]
  );

  const stageCustomExercise = useCallback(
    (exercise: NewExercise) => {
      const stagedCustomExercise: StagedCustomExercise = {
        id: generateUuid(),
        name: exercise.name,
        normalizedName: normalizeExerciseName(exercise.name),
        equipment: exercise.equipment ?? null,
        trackingType: exercise.trackingType ?? 'weight_reps',
        primaryMuscles: exercise.primaryMuscles ?? '[]',
        secondaryMuscles: exercise.secondaryMuscles ?? '[]',
        isCustom: 1,
        isArchived: 0,
        createdAt: exercise.createdAt ?? Date.now()
      };

      const currentRows = draftExerciseRowsRef.current;

      if (!currentRows) {
        return;
      }

      applyDraftRows([
        ...currentRows,
        {
          workoutExercise: {
            id: generateUuid(),
            workoutId: activeWorkout.id,
            exerciseId: stagedCustomExercise.id,
            order: currentRows.length,
            supersetId: null,
            notes: null,
            sourceWorkoutExerciseId: null
          },
          exercise: stagedCustomExercise,
          stagedCustomExercise
        }
      ]);
    },
    [activeWorkout.id, applyDraftRows]
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
    changeCount,
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
