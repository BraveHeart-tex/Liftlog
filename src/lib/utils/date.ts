type WorkoutDateFormat = 'short' | 'full';

export function toLocalDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

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

  const durationMs = completedAt - startedAt;

  if (durationMs <= 0) {
    return '< 1 min';
  }

  const totalMinutes = Math.round(durationMs / 60000);

  if (totalMinutes < 1) {
    return '< 1 min';
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}
