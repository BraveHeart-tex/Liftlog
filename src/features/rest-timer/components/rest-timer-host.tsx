import { dismissSnackbar, showSnackbar } from '@/src/components/ui/snackbar';
import { useRestTimerNotificationResponses } from '@/src/features/rest-timer/hooks/use-rest-timer-notification-responses';
import { useRestTimerWorkoutContextValidator } from '@/src/features/rest-timer/hooks/use-rest-timer-workout-context-validator';
import {
  createRestTimerCoordinator,
  type RestTimerAppState
} from '@/src/features/rest-timer/rest-timer.coordinator';
import {
  cancelRestTimerNotification,
  hasDeliveredRestTimerNotification,
  scheduleRestTimerNotification
} from '@/src/features/rest-timer/rest-timer-notifications.service';
import { restTimerSnapshotStore } from '@/src/features/rest-timer/rest-timer-runtime-snapshot.repository';
import { useRestTimerStore } from '@/src/features/rest-timer/rest-timer.store';
import {
  triggerHapticImpact,
  triggerHapticWarning
} from '@/src/lib/haptics/haptics';
import { useAudioPlayer } from 'expo-audio';
import { ImpactFeedbackStyle } from 'expo-haptics';
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { AppState, Platform } from 'react-native';

const REST_TIMER_COMPLETION_SOUND_DURATION_MS = 5000;
const REST_TIMER_COMPLETION_SNACKBAR_KEY = 'rest-timer-completion';

function currentAppState(): RestTimerAppState {
  return AppState.currentState ?? 'unknown';
}

const appStateSource = {
  current: currentAppState,
  subscribe(listener: (state: RestTimerAppState) => void) {
    const subscription = AppState.addEventListener('change', listener);

    return () => subscription.remove();
  }
};

const timerScheduler = {
  every(operation: () => void, intervalMs: number) {
    const timer = setInterval(operation, intervalMs);

    return () => clearInterval(timer);
  }
};

function RestTimerNotificationResponseHost({
  onNotificationPress
}: {
  onNotificationPress: () => void;
}) {
  useRestTimerNotificationResponses({
    onRestTimerNotificationPress: onNotificationPress
  });

  return null;
}

export function RestTimerHost({ children }: PropsWithChildren) {
  const workoutContext = useRestTimerWorkoutContextValidator();
  const [isRestored, setIsRestored] = useState(false);
  const completionHapticTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>(
    []
  );
  const completionSoundTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const player = useAudioPlayer(
    require('@/assets/sounds/rest-timer-finished.wav'),
    {
      downloadFirst: true
    }
  );
  const completionSoundOperationGenerationRef = useRef(0);
  const isAudioHostMountedRef = useRef(false);
  const playerRef = useRef(player);

  const clearCompletionHapticTimeouts = useCallback(() => {
    completionHapticTimeoutsRef.current.forEach(clearTimeout);
    completionHapticTimeoutsRef.current = [];
  }, []);

  const triggerCompletionHaptics = useCallback(() => {
    clearCompletionHapticTimeouts();
    triggerHapticWarning('rest timer completion');

    completionHapticTimeoutsRef.current = [200, 400].map(delay =>
      setTimeout(() => {
        triggerHapticImpact(
          ImpactFeedbackStyle.Heavy,
          'rest timer completion impact'
        );
      }, delay)
    );
  }, [clearCompletionHapticTimeouts]);

  const clearCompletionSoundTimeout = useCallback(() => {
    if (!completionSoundTimeoutRef.current) {
      return;
    }

    clearTimeout(completionSoundTimeoutRef.current);
    completionSoundTimeoutRef.current = null;
  }, []);

  const isCurrentAudioOperation = useCallback(
    (generation: number, operationPlayer: typeof player) =>
      isAudioHostMountedRef.current &&
      completionSoundOperationGenerationRef.current === generation &&
      playerRef.current === operationPlayer,
    []
  );

  const stopCompletionSound = useCallback(() => {
    try {
      completionSoundOperationGenerationRef.current += 1;
      clearCompletionSoundTimeout();

      const operationPlayer = playerRef.current;

      if (isAudioHostMountedRef.current) {
        operationPlayer.loop = false;
        operationPlayer.pause();
      }
    } catch (error) {
      console.error('Failed to stop rest timer completion sound', error);
    }
  }, [clearCompletionSoundTimeout]);

  const playCompletionSound = useCallback(async () => {
    const operationGeneration =
      completionSoundOperationGenerationRef.current + 1;

    completionSoundOperationGenerationRef.current = operationGeneration;
    clearCompletionSoundTimeout();

    const operationPlayer = playerRef.current;

    try {
      await operationPlayer.seekTo(0);

      if (!isCurrentAudioOperation(operationGeneration, operationPlayer)) {
        return;
      }

      operationPlayer.loop = true;
      operationPlayer.volume = 1;
      operationPlayer.play();

      if (!isCurrentAudioOperation(operationGeneration, operationPlayer)) {
        return;
      }

      completionSoundTimeoutRef.current = setTimeout(() => {
        if (
          !isCurrentAudioOperation(operationGeneration, operationPlayer) ||
          completionSoundTimeoutRef.current === null
        ) {
          return;
        }

        completionSoundTimeoutRef.current = null;
        stopCompletionSound();
      }, REST_TIMER_COMPLETION_SOUND_DURATION_MS);
    } catch (error) {
      if (!isCurrentAudioOperation(operationGeneration, operationPlayer)) {
        return;
      }

      console.error('Failed to play rest timer completion sound', error);
    }
  }, [
    clearCompletionSoundTimeout,
    isCurrentAudioOperation,
    stopCompletionSound
  ]);

  const completeFeedback = useCallback(
    async ({ showMessage }: { showMessage: boolean }) => {
      triggerCompletionHaptics();
      const sound = playCompletionSound();

      if (showMessage) {
        showSnackbar({
          key: REST_TIMER_COMPLETION_SNACKBAR_KEY,
          message: 'Rest time is up',
          actionLabel: 'Dismiss',
          onDismiss: stopCompletionSound
        });
      }

      await sound;
    },
    [playCompletionSound, stopCompletionSound, triggerCompletionHaptics]
  );

  const cancelFeedback = useCallback(() => {
    clearCompletionHapticTimeouts();
    dismissSnackbar(REST_TIMER_COMPLETION_SNACKBAR_KEY);
    stopCompletionSound();
  }, [clearCompletionHapticTimeouts, stopCompletionSound]);

  const acknowledgeFeedback = useCallback(() => {
    dismissSnackbar(REST_TIMER_COMPLETION_SNACKBAR_KEY);
    stopCompletionSound();
  }, [stopCompletionSound]);

  const coordinator = useMemo(
    () =>
      createRestTimerCoordinator({
        timer: useRestTimerStore,
        clock: { now: Date.now },
        appState: appStateSource,
        scheduler: timerScheduler,
        snapshots: restTimerSnapshotStore,
        context: workoutContext,
        notifications: {
          schedule: ({ deadlineEpochMs, context }) => {
            if (Platform.OS !== 'android') {
              return;
            }

            return scheduleRestTimerNotification({
              seconds: Math.max(
                1,
                Math.ceil((deadlineEpochMs - Date.now()) / 1000)
              ),
              deadlineEpochMs,
              context
            });
          },
          cancel: cancelRestTimerNotification,
          hasDelivered: hasDeliveredRestTimerNotification
        },
        feedback: {
          complete: completeFeedback,
          cancel: cancelFeedback,
          acknowledge: acknowledgeFeedback,
          stop: stopCompletionSound
        },
        onError: (_error, operation) => {
          console.error(`Failed to ${operation} rest timer side effects`);
        }
      }),
    [
      acknowledgeFeedback,
      cancelFeedback,
      completeFeedback,
      stopCompletionSound,
      workoutContext
    ]
  );

  useEffect(() => {
    let mounted = true;

    isAudioHostMountedRef.current = true;
    playerRef.current = player;

    void coordinator.restore().then(() => {
      if (!mounted) {
        return;
      }

      coordinator.start();
      setIsRestored(true);
    });

    return () => {
      mounted = false;
      coordinator.stop();
      isAudioHostMountedRef.current = false;
      completionSoundOperationGenerationRef.current += 1;
      clearCompletionHapticTimeouts();
      clearCompletionSoundTimeout();
    };
  }, [
    clearCompletionHapticTimeouts,
    clearCompletionSoundTimeout,
    coordinator,
    player
  ]);

  if (!isRestored) {
    return null;
  }

  return (
    <>
      {children}
      <RestTimerNotificationResponseHost
        onNotificationPress={coordinator.acknowledgeNotificationCompletion}
      />
    </>
  );
}
