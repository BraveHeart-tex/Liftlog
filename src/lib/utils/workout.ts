export function formatWorkoutName(date: Date): string {
  return `${date.toLocaleDateString(undefined, { weekday: 'long' })} workout`;
}
