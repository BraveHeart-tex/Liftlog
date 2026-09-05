import type { DrizzleDb } from '@/src/db/client';
import {
  appMeta,
  exercises,
  healthStepDays,
  personalRecords,
  sets,
  workoutExercises,
  workoutTemplateExercises,
  workoutTemplates,
  workouts
} from '@/src/db/schema';
import {
  getSettingsSnapshot,
  SETTINGS_KEYS
} from '@/src/features/settings/settings.repository';
import { rebuildPersonalRecordsForExercisesInTransaction } from '@/src/features/progress/progress.repository';
import { asc, sql } from 'drizzle-orm';
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

/** Replaces only user-owned data. Operational metadata and imported-device cache stay out. */
export function replaceBackupData(
  db: DrizzleDb,
  backup: LiftLogBackupV1
): void {
  db.transaction(tx => {
    tx.delete(personalRecords).run();
    tx.delete(sets).run();
    tx.delete(workoutExercises).run();
    tx.delete(workoutTemplateExercises).run();
    tx.delete(workoutTemplates).run();
    tx.delete(workouts).run();
    tx.delete(exercises).run();
    tx.delete(healthStepDays).run();

    if (backup.data.exercises.length) {
      tx.insert(exercises).values(backup.data.exercises).run();
    }

    if (backup.data.workouts.length) {
      tx.insert(workouts).values(backup.data.workouts).run();
    }

    if (backup.data.workoutTemplates.length) {
      tx.insert(workoutTemplates).values(backup.data.workoutTemplates).run();
    }

    if (backup.data.workoutExercises.length) {
      tx.insert(workoutExercises).values(backup.data.workoutExercises).run();
    }

    if (backup.data.workoutTemplateExercises.length) {
      tx.insert(workoutTemplateExercises)
        .values(backup.data.workoutTemplateExercises)
        .run();
    }

    if (backup.data.sets.length) {
      tx.insert(sets).values(backup.data.sets).run();
    }

    const settings = backup.data.settings;
    const values = [
      [SETTINGS_KEYS.weightUnit, settings.weightUnit],
      [SETTINGS_KEYS.restTimerDuration, String(settings.restTimerDuration)],
      [
        SETTINGS_KEYS.restTimerPresets,
        JSON.stringify(settings.restTimerPresets)
      ],
      [
        SETTINGS_KEYS.healthConnectStepsEnabled,
        String(settings.healthConnectStepsEnabled)
      ],
      [SETTINGS_KEYS.stepGoal, String(settings.stepGoal)]
    ].map(([key, value]) => ({ key, value }));
    tx.insert(appMeta)
      .values(values)
      .onConflictDoUpdate({
        target: appMeta.key,
        set: { value: sql`excluded.value` }
      })
      .run();

    rebuildPersonalRecordsForExercisesInTransaction(
      tx,
      backup.data.exercises.map(exercise => exercise.id)
    );

    const violations = tx.all<{ table: string }>(sql`PRAGMA foreign_key_check`);

    if (violations.length > 0) {
      throw new Error('Backup replacement failed foreign-key validation.');
    }
  });
}
