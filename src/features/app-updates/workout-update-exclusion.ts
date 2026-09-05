import type { DrizzleDb } from '@/src/db/client';
import { getActiveWorkoutQuery } from '@/src/features/workouts/active/active.repository';
import { isUpdateInProgress } from '@/src/features/app-updates/app-update.store';

export function canCreateWorkout(_db: DrizzleDb): boolean {
  return !isUpdateInProgress();
}

export function canStartWorkout(db: DrizzleDb): boolean {
  return canCreateWorkout(db) && getActiveWorkoutQuery(db).all().length === 0;
}
