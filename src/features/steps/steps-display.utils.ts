import type { HealthStepDay } from '@/src/db/schema';
import { getRecentLocalDayRanges } from '@/src/features/steps/steps-date.utils';
import type { HealthConnectAvailability } from '@/src/features/steps/health-connect.service';

const RECENT_STEP_STATUS_DAY_COUNT = 7;

export interface StepRecentActivityStatus {
  averageSteps: number | null;
  goalPercent: number | null;
  interpretation: string;
  syncedDayCount: number;
  requiredDayCount: number;
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

export function formatStepWeekdayShort(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
    new Date(timestamp)
  );
}

export function formatStepMonthDay(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  }).format(new Date(timestamp));
}

export function getStepRecentActivityStatus(
  days: HealthStepDay[],
  goal: number
): StepRecentActivityStatus {
  const ranges = getRecentLocalDayRanges(RECENT_STEP_STATUS_DAY_COUNT);
  const daysByDateKey = new Map(days.map(day => [day.dateKey, day]));
  const recentDays = ranges
    .map(range => daysByDateKey.get(range.dateKey))
    .filter((day): day is HealthStepDay => Boolean(day));

  if (recentDays.length < RECENT_STEP_STATUS_DAY_COUNT) {
    return {
      averageSteps: null,
      goalPercent: null,
      interpretation: 'Sync more days to compare your recent activity.',
      syncedDayCount: recentDays.length,
      requiredDayCount: RECENT_STEP_STATUS_DAY_COUNT
    };
  }

  const averageSteps = Math.round(
    recentDays.reduce((total, day) => total + day.steps, 0) / recentDays.length
  );
  const goalPercent =
    goal > 0 ? Math.max(0, Math.round((averageSteps / goal) * 100)) : null;

  let interpretation =
    averageSteps === 0
      ? 'Your synced recent days average 0 steps.'
      : 'Recent activity is ready.';

  if (goalPercent !== null && averageSteps > 0) {
    if (goalPercent >= 100) {
      interpretation = 'At or above your daily goal lately.';
    } else if (goalPercent >= 80) {
      interpretation = 'Near your daily goal lately.';
    } else {
      interpretation = 'Below your daily goal lately.';
    }
  }

  return {
    averageSteps,
    goalPercent,
    interpretation,
    syncedDayCount: recentDays.length,
    requiredDayCount: RECENT_STEP_STATUS_DAY_COUNT
  };
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
