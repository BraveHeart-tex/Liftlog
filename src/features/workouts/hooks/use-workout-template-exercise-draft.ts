import { useDrizzle } from '@/src/components/database-provider';
import type {
  NewExercise,
  WorkoutTemplate,
  WorkoutTemplateExercise
} from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import type { TemplateExerciseEditorRow } from '@/src/features/workouts/components/template-exercise-editor';
import {
  saveWorkoutTemplateExerciseDraft,
  WorkoutTemplateExerciseDraftConflictError,
  type StagedTemplateCustomExercise,
  type WorkoutTemplateExerciseDraftBaselineRow
} from '@/src/features/workouts/workout-template.repository';
import { normalizeSupersetRows } from '@/src/features/workouts/superset.utils';
import { generateUuid } from '@/src/lib/utils/uuid.utils';
import { useCallback, useMemo, useRef, useState } from 'react';

interface DraftExerciseRow {
  templateExercise: WorkoutTemplateExercise;
  exercise: ExerciseListItem;
  stagedCustomExercise?: StagedTemplateCustomExercise;
}

interface UseWorkoutTemplateExerciseDraftParams {
  template: WorkoutTemplate;
  templateExerciseRows: WorkoutTemplateExercise[];
  exerciseById: Map<ExerciseListItem['id'], ExerciseListItem>;
}

function reconcileDraftRows(
  currentRows: DraftExerciseRow[],
  rows: Pick<WorkoutTemplateExercise, 'id' | 'supersetId'>[]
): DraftExerciseRow[] {
  const currentRowById = new Map(
    currentRows.map(row => [row.templateExercise.id, row] as const)
  );

  return rows.flatMap((row, order) => {
    const currentRow = currentRowById.get(row.id);

    return currentRow
      ? [
          {
            ...currentRow,
            templateExercise: {
              ...currentRow.templateExercise,
              order,
              supersetId: row.supersetId
            }
          }
        ]
      : [];
  });
}

export type SaveWorkoutTemplateExerciseDraftResult =
  | { status: 'saved' }
  | { status: 'unchanged' }
  | {
      status: 'conflict';
      error: WorkoutTemplateExerciseDraftConflictError;
    }
  | { status: 'error'; error: unknown };

export function useWorkoutTemplateExerciseDraft({
  template,
  templateExerciseRows,
  exerciseById
}: UseWorkoutTemplateExerciseDraftParams) {
  const db = useDrizzle();
  const isSavingRef = useRef(false);
  const [draftExerciseRows, setDraftExerciseRows] =
    useState<DraftExerciseRow[]>();
  const [baselineExerciseRows, setBaselineExerciseRows] =
    useState<WorkoutTemplateExerciseDraftBaselineRow[]>();
  const [isSaving, setIsSaving] = useState(false);

  const start = useCallback(() => {
    setDraftExerciseRows(
      templateExerciseRows.flatMap(templateExercise => {
        const exercise = exerciseById.get(templateExercise.exerciseId);

        return exercise ? [{ templateExercise, exercise }] : [];
      })
    );
    setBaselineExerciseRows(
      templateExerciseRows.map(templateExercise => ({
        id: templateExercise.id,
        exerciseId: templateExercise.exerciseId,
        order: templateExercise.order,
        supersetId: templateExercise.supersetId
      }))
    );
    isSavingRef.current = false;
    setIsSaving(false);
  }, [exerciseById, templateExerciseRows]);

  const discard = useCallback(() => {
    setDraftExerciseRows(undefined);
    setBaselineExerciseRows(undefined);
    isSavingRef.current = false;
    setIsSaving(false);
  }, []);

  const hasChanges = useMemo(() => {
    if (!draftExerciseRows || !baselineExerciseRows) {
      return false;
    }

    return (
      draftExerciseRows.length !== baselineExerciseRows.length ||
      draftExerciseRows.some(({ templateExercise }, order) => {
        const baselineRow = baselineExerciseRows.find(
          baseline => baseline.id === templateExercise.id
        );

        return (
          !baselineRow ||
          baselineRow.order !== order ||
          baselineRow.exerciseId !== templateExercise.exerciseId ||
          baselineRow.supersetId !== templateExercise.supersetId
        );
      })
    );
  }, [baselineExerciseRows, draftExerciseRows]);

  const draftTemplateExercises = useMemo<TemplateExerciseEditorRow[]>(
    () =>
      draftExerciseRows?.map(({ templateExercise, exercise }) => ({
        id: templateExercise.id,
        exercise,
        supersetId: templateExercise.supersetId
      })) ?? [],
    [draftExerciseRows]
  );

  const draftExerciseById = useMemo(() => {
    const nextExerciseById = new Map(exerciseById);

    for (const row of draftExerciseRows ?? []) {
      nextExerciseById.set(row.exercise.id, row.exercise);
    }

    return nextExerciseById;
  }, [draftExerciseRows, exerciseById]);

  const selectedExerciseIds = useMemo(
    () => draftExerciseRows?.map(row => row.templateExercise.exerciseId) ?? [],
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
    (rows: Pick<WorkoutTemplateExercise, 'id' | 'supersetId'>[]) => {
      setDraftExerciseRows(currentRows => {
        if (!currentRows) {
          return currentRows;
        }

        return reconcileDraftRows(currentRows, rows);
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
          currentRows.map(row => row.templateExercise.exerciseId)
        );
        const addedExercises = exercises.filter(
          exercise => !selectedExerciseIdSet.has(exercise.id)
        );

        return [
          ...currentRows,
          ...addedExercises.map((exercise, index) => ({
            templateExercise: {
              id: generateUuid(),
              templateId: template.id,
              exerciseId: exercise.id,
              order: currentRows.length + index,
              supersetId: null
            },
            exercise
          }))
        ];
      });
    },
    [template.id]
  );

  const removeExercise = useCallback((rowId: WorkoutTemplateExercise['id']) => {
    setDraftExerciseRows(currentRows => {
      if (!currentRows) {
        return currentRows;
      }

      const normalizedRows = normalizeSupersetRows(
        currentRows
          .filter(row => row.templateExercise.id !== rowId)
          .map(row => ({
            id: row.templateExercise.id,
            supersetId: row.templateExercise.supersetId
          }))
      );

      return reconcileDraftRows(currentRows, normalizedRows);
    });
  }, []);

  const stageCustomExercise = useCallback(
    (exercise: NewExercise) => {
      const stagedCustomExercise: StagedTemplateCustomExercise = {
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
                templateExercise: {
                  id: generateUuid(),
                  templateId: template.id,
                  exerciseId: stagedCustomExercise.id,
                  order: currentRows.length,
                  supersetId: null
                },
                exercise: stagedCustomExercise,
                stagedCustomExercise
              }
            ]
          : currentRows
      );
    },
    [template.id]
  );

  const save = useCallback((): SaveWorkoutTemplateExerciseDraftResult => {
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
      saveWorkoutTemplateExerciseDraft(
        db,
        template.id,
        draftExerciseRows.map(row => ({
          id: row.templateExercise.id,
          exerciseId: row.templateExercise.exerciseId,
          supersetId: row.templateExercise.supersetId
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

      return error instanceof WorkoutTemplateExerciseDraftConflictError
        ? { status: 'conflict', error }
        : { status: 'error', error };
    }
  }, [baselineExerciseRows, db, draftExerciseRows, hasChanges, template.id]);

  return {
    addExercises,
    changeRows,
    discard,
    draftExerciseById,
    draftTemplateExercises,
    hasChanges,
    isInitialized: draftExerciseRows !== undefined,
    isSaving,
    removeExercise,
    save,
    selectedExerciseIds,
    stageCustomExercise,
    stagedCustomExerciseNames,
    start
  };
}
