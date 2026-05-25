import type { HealthConnectAvailability } from '@/src/features/steps/health-connect';
import type { LiveStepCounterStatus } from '@/src/features/steps/hooks/use-live-step-counter';

export function formatSteps(steps: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0
  }).format(steps);
}

export function formatCompactSteps(steps: number): string {
  if (steps >= 1000) {
    return `${Math.round(steps / 1000)}k`;
  }

  return String(Math.round(steps));
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
