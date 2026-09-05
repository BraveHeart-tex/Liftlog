import type { LiftLogBackupV1 } from '@/src/features/backup/backup.types';
import type { BackupErrorCategory } from '@/src/features/backup/backup.codec';

export interface BackupPreview {
  createdAt: string;
  appVersion: string;
  counts: {
    exercises: number;
    workouts: number;
    workoutExercises: number;
    sets: number;
    workoutTemplates: number;
    workoutTemplateExercises: number;
  };
  replacesActiveWorkout: boolean;
}

export function createBackupPreview(backup: LiftLogBackupV1): BackupPreview {
  const { data } = backup;

  return {
    createdAt: backup.createdAt,
    appVersion: backup.appVersion,
    counts: {
      exercises: data.exercises.length,
      workouts: data.workouts.length,
      workoutExercises: data.workoutExercises.length,
      sets: data.sets.length,
      workoutTemplates: data.workoutTemplates.length,
      workoutTemplateExercises: data.workoutTemplateExercises.length
    },
    replacesActiveWorkout: data.workouts.some(
      row => row.status === 'in_progress'
    )
  };
}

export function getBackupErrorCategory(
  error: unknown
): BackupErrorCategory | 'unreadable-file' {
  return error instanceof Error && 'category' in error
    ? (error as Error & { category: BackupErrorCategory }).category
    : 'unreadable-file';
}
