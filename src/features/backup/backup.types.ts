import type {
  Exercise,
  Set,
  Workout,
  WorkoutExercise,
  WorkoutTemplate,
  WorkoutTemplateExercise
} from '@/src/db/schema';
import type {
  RestTimerPreset,
  WeightUnit
} from '@/src/features/settings/settings.repository';
import type { ThemePreference } from '@/src/theme/theme-preference';

export type BackupExerciseV1 = Pick<
  Exercise,
  | 'id'
  | 'name'
  | 'normalizedName'
  | 'equipment'
  | 'trackingType'
  | 'primaryMuscles'
  | 'secondaryMuscles'
  | 'isCustom'
  | 'isArchived'
  | 'createdAt'
>;

export type BackupWorkoutV1 = Pick<
  Workout,
  | 'id'
  | 'name'
  | 'status'
  | 'startedAt'
  | 'dateKey'
  | 'completedAt'
  | 'notes'
  | 'sourceSnapshot'
  | 'sourceWorkoutId'
>;

export type BackupWorkoutExerciseV1 = Pick<
  WorkoutExercise,
  | 'id'
  | 'workoutId'
  | 'exerciseId'
  | 'order'
  | 'supersetId'
  | 'notes'
  | 'sourceWorkoutExerciseId'
>;

export type BackupSetV1 = Pick<
  Set,
  | 'id'
  | 'workoutExerciseId'
  | 'order'
  | 'weightKg'
  | 'reps'
  | 'distanceMeters'
  | 'durationMs'
  | 'durationSeconds'
  | 'rpe'
  | 'status'
  | 'completedAt'
  | 'sourceSetId'
>;

export type BackupWorkoutTemplateV1 = Pick<
  WorkoutTemplate,
  'id' | 'name' | 'sourceWorkoutId' | 'createdAt' | 'updatedAt'
>;

export type BackupWorkoutTemplateExerciseV1 = Pick<
  WorkoutTemplateExercise,
  'id' | 'templateId' | 'exerciseId' | 'order' | 'supersetId'
>;

export interface BackupSettingsV1 {
  weightUnit: WeightUnit;
  restTimerDuration: number;
  restTimerPresets: RestTimerPreset[];
  healthConnectStepsEnabled: boolean;
  stepGoal: number;
}

export interface LiftLogBackupV1 {
  format: 'liftlog-backup';
  schemaVersion: 1;
  createdAt: string;
  appVersion: string;
  data: {
    exercises: BackupExerciseV1[];
    workouts: BackupWorkoutV1[];
    workoutExercises: BackupWorkoutExerciseV1[];
    sets: BackupSetV1[];
    workoutTemplates: BackupWorkoutTemplateV1[];
    workoutTemplateExercises: BackupWorkoutTemplateExerciseV1[];
    settings: BackupSettingsV1;
    themePreference: ThemePreference;
  };
}
