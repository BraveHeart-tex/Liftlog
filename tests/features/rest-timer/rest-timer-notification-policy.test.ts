import {
  getNotificationPresentation,
  getRestTimerNotificationDestination,
  getRestTimerNotificationPreferenceState
} from '@/src/features/rest-timer/rest-timer-notification-policy';
import assert from 'node:assert/strict';
import test from 'node:test';

test('presentation suppresses only active rest timer notifications', () => {
  assert.equal(
    getNotificationPresentation(true, 'active').shouldShowBanner,
    false
  );
  assert.equal(
    getNotificationPresentation(true, 'background').shouldShowBanner,
    true
  );
  assert.equal(
    getNotificationPresentation(false, 'active').shouldShowBanner,
    true
  );
});

test('preference states preserve enabled intent when permission is blocked', () => {
  assert.equal(
    getRestTimerNotificationPreferenceState({
      enabled: false,
      enabling: false,
      permissionGranted: false
    }),
    'Off'
  );
  assert.equal(
    getRestTimerNotificationPreferenceState({
      enabled: true,
      enabling: true,
      permissionGranted: false
    }),
    'Enabling'
  );
  assert.equal(
    getRestTimerNotificationPreferenceState({
      enabled: true,
      enabling: false,
      permissionGranted: false
    }),
    'Blocked'
  );
  assert.equal(
    getRestTimerNotificationPreferenceState({
      enabled: true,
      enabling: false,
      permissionGranted: true
    }),
    'On'
  );
});

test('routing falls back from exercise to workout to workouts', () => {
  assert.deepEqual(
    getRestTimerNotificationDestination({
      activeWorkout: true,
      workoutExerciseId: 'exercise-1'
    }),
    { kind: 'exercise', workoutExerciseId: 'exercise-1' }
  );
  assert.deepEqual(
    getRestTimerNotificationDestination({ activeWorkout: true }),
    { kind: 'active-workout' }
  );
  assert.deepEqual(
    getRestTimerNotificationDestination({ activeWorkout: false }),
    { kind: 'workouts' }
  );
});
