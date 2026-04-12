import type { Exercise } from '@/src/db';
import { toTitleCase } from '@/src/lib/utils/string';

export function parseMuscleList(value: Exercise['primaryMuscles']): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export function formatMuscleList(muscles: string[]) {
  if (muscles.length === 0) {
    return 'Unspecified';
  }

  return muscles.map(toTitleCase).join(', ');
}
