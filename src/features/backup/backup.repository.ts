import type { DrizzleDb } from '@/src/db/client';
import {
  exercises,
  sets,
  workoutExercises,
  workoutTemplateExercises,
  workoutTemplates,
  workouts
} from '@/src/db/schema';
import { getSettingsSnapshot } from '@/src/features/settings/settings.repository';
import { asc } from 'drizzle-orm';
import type { LiftLogBackupV1 } from '@/src/features/backup/backup.types';
import type { ThemePreference } from '@/src/theme/theme-preference';

const byId = <T extends { id: string }>(left: T, right: T) =>
  left.id.localeCompare(right.id);

export function createBackupSnapshot(
  db: DrizzleDb,
  appVersion: string,
  themePreference: ThemePreference,
  createdAt = new Date().toISOString()
): LiftLogBackupV1 {
  return db.transaction(tx => {
    const settings = getSettingsSnapshot(tx);
    const exerciseRows = tx
      .select()
      .from(exercises)
      .orderBy(asc(exercises.id))
      .all();
    const workoutRows = tx
      .select()
      .from(workouts)
      .orderBy(asc(workouts.id))
      .all();
    const workoutExerciseRows = tx
      .select()
      .from(workoutExercises)
      .orderBy(
        asc(workoutExercises.workoutId),
        asc(workoutExercises.order),
        asc(workoutExercises.id)
      )
      .all();
    const setRows = tx
      .select()
      .from(sets)
      .orderBy(asc(sets.workoutExerciseId), asc(sets.order), asc(sets.id))
      .all();
    const templateRows = tx
      .select()
      .from(workoutTemplates)
      .orderBy(asc(workoutTemplates.id))
      .all();
    const templateExerciseRows = tx
      .select()
      .from(workoutTemplateExercises)
      .orderBy(
        asc(workoutTemplateExercises.templateId),
        asc(workoutTemplateExercises.order),
        asc(workoutTemplateExercises.id)
      )
      .all();

    return {
      format: 'liftlog-backup',
      schemaVersion: 1,
      createdAt,
      appVersion,
      data: {
        exercises: exerciseRows.sort(byId),
        workouts: workoutRows.sort(byId),
        workoutExercises: workoutExerciseRows,
        sets: setRows,
        workoutTemplates: templateRows.sort(byId),
        workoutTemplateExercises: templateExerciseRows,
        settings,
        themePreference
      }
    };
  });
}
