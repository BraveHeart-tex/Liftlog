import {
  createRestTimerDiagnostic,
  type RestTimerDiagnosticEnvironment
} from '@/src/features/rest-timer/rest-timer-diagnostics';
import assert from 'node:assert/strict';
import test from 'node:test';

test('diagnostics expose only stable allowlisted metadata', () => {
  const environment: RestTimerDiagnosticEnvironment = {
    platform: 'android',
    appState: 'background',
    permission: 'blocked',
    exactAlarm: 'unavailable'
  };
  const secret = {
    workoutId: 'workout-secret',
    workoutExerciseId: 'exercise-secret',
    exerciseName: 'Secret press',
    notificationContent: 'Back to Secret press',
    workoutValue: 140,
    path: '/private/workouts/secret',
    error: new Error('raw native secret')
  };

  const diagnostic = createRestTimerDiagnostic(
    'schedule',
    'native_failure',
    environment
  );
  const encoded = JSON.stringify({ diagnostic, secretExcluded: undefined });

  assert.deepEqual(diagnostic, {
    reason: 'native_failure',
    platform: 'android',
    appState: 'background',
    permission: 'blocked',
    exactAlarm: 'unavailable',
    operation: 'schedule',
    outcome: 'failure'
  });

  for (const privateValue of Object.values(secret)) {
    assert.equal(encoded.includes(String(privateValue)), false);
  }
});
