import type { RestTimerAppState } from './rest-timer.coordinator';

export type RestTimerDiagnosticOperation =
  | 'schedule'
  | 'cancel'
  | 'complete'
  | 'acknowledge'
  | 'stop'
  | 'persist'
  | 'restore';

export type RestTimerDiagnosticReason =
  | 'native_failure'
  | 'persistence_failure'
  | 'invalid_snapshot';

export interface RestTimerDiagnosticEnvironment {
  platform: 'android' | 'ios' | 'other';
  appState: RestTimerAppState;
  permission: 'granted' | 'blocked' | 'unknown';
  exactAlarm: 'available' | 'unavailable' | 'unsupported' | 'unknown';
}

export function createRestTimerDiagnostic(
  operation: RestTimerDiagnosticOperation,
  reason: RestTimerDiagnosticReason,
  environment: RestTimerDiagnosticEnvironment
) {
  return {
    reason,
    platform: environment.platform,
    appState: environment.appState,
    permission: environment.permission,
    exactAlarm: environment.exactAlarm,
    operation,
    outcome: 'failure' as const
  };
}
