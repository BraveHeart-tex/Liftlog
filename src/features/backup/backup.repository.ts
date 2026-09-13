import type { DrizzleDb } from '@/src/db/client';
import { parseBackupEnvelope } from '@/src/features/backup/backup.codec';
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
import type { LiftLogBackupV2 } from '@/src/features/backup/backup.types';
import type { ThemePreference } from '@/src/theme/theme-preference';
import { applicationUpdateExclusion } from '@/src/features/app-updates/update-exclusion';

const byId = <T extends { id: string }>(left: T, right: T) =>
  left.id.localeCompare(right.id);

export function createBackupSnapshot(
  db: DrizzleDb,
  appVersion: string,
  themePreference: ThemePreference,
  createdAt = new Date().toISOString()
): LiftLogBackupV2 {
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
      schemaVersion: 2,
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
  backup: LiftLogBackupV2
): void {
  const validatedBackup = parseBackupEnvelope(backup);

  if (
    validatedBackup.data.workouts.some(
      workout => workout.status === 'in_progress'
    )
  ) {
    applicationUpdateExclusion.assertWorkoutCreationAllowed();
  }

  db.transaction(tx => {
    tx.delete(personalRecords).run();
    tx.delete(sets).run();
    tx.delete(workoutExercises).run();
    tx.delete(workoutTemplateExercises).run();
    tx.delete(workoutTemplates).run();
    tx.delete(workouts).run();
    tx.delete(exercises).run();
    tx.delete(healthStepDays).run();

    if (validatedBackup.data.exercises.length) {
      tx.insert(exercises).values(validatedBackup.data.exercises).run();
    }

    if (validatedBackup.data.workouts.length) {
      tx.insert(workouts).values(validatedBackup.data.workouts).run();
    }

    if (validatedBackup.data.workoutTemplates.length) {
      tx.insert(workoutTemplates)
        .values(validatedBackup.data.workoutTemplates)
        .run();
    }

    if (validatedBackup.data.workoutExercises.length) {
      tx.insert(workoutExercises)
        .values(validatedBackup.data.workoutExercises)
        .run();
    }

    if (validatedBackup.data.workoutTemplateExercises.length) {
      tx.insert(workoutTemplateExercises)
        .values(validatedBackup.data.workoutTemplateExercises)
        .run();
    }

    if (validatedBackup.data.sets.length) {
      tx.insert(sets).values(validatedBackup.data.sets).run();
    }

    const settings = validatedBackup.data.settings;
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
      [SETTINGS_KEYS.stepGoal, String(settings.stepGoal)],
      [
        SETTINGS_KEYS.restTimerNotificationsEnabled,
        String(settings.restTimerNotificationsEnabled)
      ]
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
      validatedBackup.data.exercises.map(exercise => exercise.id)
    );

    const violations = tx.all<{ table: string }>(sql`PRAGMA foreign_key_check`);

    if (violations.length > 0) {
      throw new Error('Backup replacement failed foreign-key validation.');
    }
  });
}
