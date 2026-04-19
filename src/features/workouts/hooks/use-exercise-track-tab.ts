import type { Set } from '@/src/db/schema';
import {
  getPersonalRecordsByExercise,
  getPersonalRecordsByExerciseQuery
} from '@/src/features/progress/repository';
import { useDrizzle } from '@/src/components/database-provider';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo, useState } from 'react';
import type { WorkoutExerciseWithSets } from '../components/types';

export function useExerciseTrackTab(item: WorkoutExerciseWithSets) {
  const db = useDrizzle();
  const [editingSetId, setEditingSetId] = useState<Set['id'] | null>(null);
  const editingSet = item.sets.find(set => set.id === editingSetId);
  const exerciseId = item.workoutExercise.exerciseId;
  const prResult = useLiveWithFallback(
    () => getPersonalRecordsByExerciseQuery(db, exerciseId),
    () => getPersonalRecordsByExercise(db, exerciseId),
    [db, exerciseId]
  );
  const prSetIds = useMemo(
    () => new Set(prResult.data.map(personalRecord => personalRecord.setId)),
    [prResult.data]
  );

  return {
    editingSetId,
    editingSet,
    setEditingSetId,
    prSetIds
  };
}
