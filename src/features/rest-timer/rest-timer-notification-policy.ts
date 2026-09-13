export type RestTimerNotificationPreferenceState =
  | 'Off'
  | 'Enabling'
  | 'On'
  | 'Blocked';

export function getRestTimerNotificationPreferenceState(input: {
  enabled: boolean;
  enabling: boolean;
  permissionGranted: boolean;
}): RestTimerNotificationPreferenceState {
  if (!input.enabled) {
    return 'Off';
  }

  if (input.enabling) {
    return 'Enabling';
  }

  return input.permissionGranted ? 'On' : 'Blocked';
}

export function getNotificationPresentation(
  isRestTimer: boolean,
  appState: string | null
) {
  const shouldSuppress = isRestTimer && appState === 'active';

  return {
    shouldShowBanner: !shouldSuppress,
    shouldShowList: !shouldSuppress,
    shouldPlaySound: !shouldSuppress,
    shouldSetBadge: false
  };
}

export function getRestTimerNotificationDestination(input: {
  activeWorkout: boolean;
  workoutExerciseId?: string;
}) {
  if (!input.activeWorkout) {
    return { kind: 'workouts' } as const;
  }

  if (input.workoutExerciseId) {
    return {
      kind: 'exercise',
      workoutExerciseId: input.workoutExerciseId
    } as const;
  }

  return { kind: 'active-workout' } as const;
}
