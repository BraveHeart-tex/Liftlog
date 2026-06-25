import type { Set } from '@/src/db/schema';

export interface ExerciseProgressPoint {
  workoutId: string;
  date: number;
  value: number;
  valueLabel: string;
}

export interface ExercisePersonalRecordSummaryItem {
  id: 'best-set' | 'most-sets';
  label: string;
  value: string;
  count?: number;
  achievedAt: number;
  isNewRecord: boolean;
}

export interface ExerciseTopSetPerformance {
  id: Set['id'];
  value: string;
  scoreLabel: string;
  achievedAt: number;
}
