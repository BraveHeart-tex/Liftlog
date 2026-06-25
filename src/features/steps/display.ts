import type { HealthStepDay } from '@/src/db/schema';
import {
  getRecentLocalDayRanges,
  getTodayDateKey
} from '@/src/features/steps/date';
import type { HealthConnectAvailability } from '@/src/features/steps/health-connect';
import type { LiveStepCounterStatus } from '@/src/features/steps/hooks/use-live-step-counter';
import { formatWorkoutDate } from '@/src/lib/utils/date';

export const STEP_GOAL_CONSISTENCY_DAY_COUNT = 7;

export type StepAverageComparisonTone = 'success' | 'danger' | 'muted';

interface StepAverageComparison {
  detail: string;
  percentLabel: string;
  tone: StepAverageComparisonTone;
}

interface StepGoalConsistencyDay {
  dateLabel: string;
  dateKey: string;
  hit: boolean;
  isToday: boolean;
  label: string;
  progress: number;
  steps: number;
}

export function formatSteps(steps: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0
  }).format(steps);
}

export function formatStepWeekday(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(
    new Date(timestamp)
  );
}

export function formatStepMonthDay(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  }).format(new Date(timestamp));
}

function formatStepWeekdayInitial(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' })
    .format(new Date(timestamp))
    .slice(0, 1);
}

export function getStepAverageComparison(
  todaySteps: number,
  averageSteps: number
): StepAverageComparison {
  if (averageSteps <= 0) {
    return {
      detail: 'No average yet',
      percentLabel: '0%',
      tone: 'muted'
    };
  }

  const difference = todaySteps - averageSteps;
  const percent = Math.trunc((difference / averageSteps) * 100);
  const absoluteDifference = Math.abs(difference);

  if (difference > 0) {
    return {
      detail: `${formatSteps(absoluteDifference)} above average`,
      percentLabel: `+${percent}%`,
      tone: 'success'
    };
  }

  if (difference < 0) {
    return {
      detail: `${formatSteps(absoluteDifference)} below average`,
      percentLabel: `${percent}%`,
      tone: 'danger'
    };
  }

  return {
    detail: 'Same as average',
    percentLabel: '0%',
    tone: 'muted'
  };
}

export function getStepGoalConsistencyDays(
  days: HealthStepDay[],
  goal: number
): StepGoalConsistencyDay[] {
  const daysByDateKey = new Map(days.map(day => [day.dateKey, day]));
  const todayDateKey = getTodayDateKey();

  return getRecentLocalDayRanges(STEP_GOAL_CONSISTENCY_DAY_COUNT).map(range => {
    const day = daysByDateKey.get(range.dateKey);
    const steps = day?.steps ?? 0;
    const progress =
      goal > 0 && Number.isFinite(steps / goal) ? Math.max(0, steps / goal) : 0;

    return {
      dateKey: range.dateKey,
      dateLabel: formatWorkoutDate(range.startAt),
      hit: goal > 0 && steps >= goal,
      isToday: range.dateKey === todayDateKey,
      label: formatStepWeekdayInitial(range.startAt),
      progress,
      steps
    };
  });
}

export function getStepGoalConsistencyAverageSteps(
  days: StepGoalConsistencyDay[]
): number {
  if (days.length === 0) {
    return 0;
  }

  return Math.round(
    days.reduce((total, day) => total + day.steps, 0) / days.length
  );
}

export function getStepGoalConsistencyHitCount(
  days: StepGoalConsistencyDay[],
  goal: number
): number {
  if (goal <= 0) {
    return 0;
  }

  return days.filter(day => day.hit).length;
}

export function getStepGoalConsistencyFillHeight({
  barHeight,
  goalHeightPercent,
  progress
}: {
  barHeight: number;
  goalHeightPercent: number;
  progress: number;
}): number {
  return Math.min(barHeight, progress * barHeight * (goalHeightPercent / 100));
}

export function getAvailabilityLabel(
  availability: HealthConnectAvailability
): string {
  if (availability === 'available') {
    return 'Health Connect ready';
  }

  if (availability === 'provider_update_required') {
    return 'Health Connect update required';
  }

  if (availability === 'unsupported') {
    return 'Android only';
  }

  return 'Health Connect unavailable';
}

export function getLiveStepCounterBadgeLabel(
  status: LiveStepCounterStatus,
  liveStepDelta: number
) {
  if (status === 'active') {
    return liveStepDelta > 0 ? `Live +${formatSteps(liveStepDelta)}` : 'Live';
  }

  if (status === 'checking') {
    return 'Starting live';
  }

  return null;
}

export function getLiveStepCounterMessage(
  status: LiveStepCounterStatus,
  errorMessage: string | null
): string | null {
  if (status === 'permission_denied') {
    return 'Allow Activity Recognition to show live steps.';
  }

  if (status === 'unavailable' || status === 'no_sensor') {
    return 'Live step counting is not available on this device.';
  }

  if (status === 'error') {
    return errorMessage ?? 'Live step counting stopped.';
  }

  return null;
}
