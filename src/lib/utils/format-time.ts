interface FormatTimeOptions {
  padMinutes?: boolean;
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
