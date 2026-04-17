type WorkoutDateFormat = 'short' | 'full';

export function formatWorkoutDate(
  timestamp: number,
  format: WorkoutDateFormat = 'short'
): string {
  const options: Record<WorkoutDateFormat, Intl.DateTimeFormatOptions> = {
    short: {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    },
    full: {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  };

  return new Intl.DateTimeFormat(undefined, options[format]).format(
    new Date(timestamp)
  );
}

// TODO: Make the duration more readable
export function formatDuration({
  startedAt,
  completedAt
}: {
  startedAt: number;
  completedAt: number | null;
}): string {
  if (completedAt === null) {
    return '—';
  }

  const durationMinutes = Math.round((completedAt - startedAt) / 60000);

  if (durationMinutes < 1) {
    return '< 1 min';
  }

  return `${durationMinutes} min`;
}
