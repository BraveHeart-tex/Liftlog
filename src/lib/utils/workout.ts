import type { Workout } from '@/src/db';
import { toLocalDateKey } from '@/src/lib/utils/date';

function resolveWorkoutDate(value: Date | number): Date {
  return value instanceof Date ? value : new Date(value);
}

const defaultTemplateName = 'Workout template';

export function formatWorkoutName(value: Date | number): string {
  return `${resolveWorkoutDate(value).toLocaleDateString(undefined, {
    weekday: 'long'
  })} workout`;
}

export function resolveWorkoutName(name: string, startedAt: number): string {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return formatWorkoutName(startedAt);
  }

  return trimmedName;
}

export function resolveTemplateName(name: string): string {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return defaultTemplateName;
  }

  return trimmedName;
}

export function getWorkoutCountByDateKey(
  workouts: Workout[]
): Map<string, number> {
  const workoutCountByDateKey = new Map<string, number>();

  for (const workout of workouts) {
    const dateKey = toLocalDateKey(workout.startedAt);

    workoutCountByDateKey.set(
      dateKey,
      (workoutCountByDateKey.get(dateKey) ?? 0) + 1
    );
  }

  return workoutCountByDateKey;
}
