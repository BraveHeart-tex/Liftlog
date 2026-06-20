interface FormatTimeOptions {
  padMinutes?: boolean;
}

export interface DurationMsParts {
  hours: number;
  minutes: number;
  seconds: number;
  centiseconds: number;
}

export function formatTime(
  seconds: number,
  { padMinutes = false }: FormatTimeOptions = {}
): string {
  const minutes = Math.floor(seconds / 60);
  const formattedMinutes = padMinutes
    ? minutes.toString().padStart(2, '0')
    : minutes.toString();
  const formattedSeconds = (seconds % 60).toString().padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
}

export function getDurationMsParts(milliseconds: number): DurationMsParts {
  const totalCentiseconds = Math.max(0, Math.round(milliseconds / 10));

  return {
    hours: Math.floor(totalCentiseconds / 360000),
    minutes: Math.floor((totalCentiseconds % 360000) / 6000),
    seconds: Math.floor((totalCentiseconds % 6000) / 100),
    centiseconds: totalCentiseconds % 100
  };
}

export function formatDurationMs(milliseconds: number): string {
  const { hours, minutes, seconds, centiseconds } =
    getDurationMsParts(milliseconds);
  const formattedCentiseconds = centiseconds.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  if (hours === 0) {
    return `${minutes}:${formattedSeconds}.${formattedCentiseconds}`;
  }

  const formattedMinutes = minutes.toString().padStart(2, '0');

  return `${hours}:${formattedMinutes}:${formattedSeconds}.${formattedCentiseconds}`;
}
