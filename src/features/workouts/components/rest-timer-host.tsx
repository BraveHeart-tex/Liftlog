import { dismissSnackbar, showSnackbar } from '@/src/components/ui/snackbar';
import { useRestTimerNotificationResponses } from '@/src/features/workouts/hooks/use-rest-timer-notification-responses';
import {
  cancelRestTimerNotification,
  scheduleRestTimerNotification
} from '@/src/features/workouts/rest-timer-notifications.service';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer.store';
import { useAudioPlayer } from 'expo-audio';
import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync
} from 'expo-haptics';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const REST_TIMER_COMPLETION_SOUND_DURATION_MS = 5000;
const REST_TIMER_COMPLETION_SNACKBAR_KEY = 'rest-timer-completion';

function triggerCompletionHaptics() {
  notificationAsync(NotificationFeedbackType.Warning).catch(error => {
    console.error('Failed to trigger rest timer completion haptics', error);
  });

  setTimeout(() => {
    impactAsync(ImpactFeedbackStyle.Heavy).catch(error => {
      console.error('Failed to trigger rest timer impact haptics', error);
    });
  }, 200);

  setTimeout(() => {
    impactAsync(ImpactFeedbackStyle.Heavy).catch(error => {
      console.error('Failed to trigger rest timer impact haptics', error);
    });
  }, 400);
}

export function RestTimerHost() {
  const status = useRestTimerStore(state => state.status);
  const endTime = useRestTimerStore(state => state.endTime);
  const context = useRestTimerStore(state => state.context);
  const completionCount = useRestTimerStore(state => state.completionCount);
  const isSheetOpen = useRestTimerStore(state => state.isSheetOpen);
  const tick = useRestTimerStore(state => state.tick);
  const lastHandledCompletionCountRef = useRef(completionCount);
  const wasSheetOpenRef = useRef(isSheetOpen);
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

  const acknowledgeNotificationCompletion = useCallback(() => {
    const timerState = useRestTimerStore.getState();

    if (
      timerState.status === 'running' &&
      timerState.endTime !== null &&
      timerState.endTime <= Date.now()
    ) {
      timerState.cancel();
    }

    lastHandledCompletionCountRef.current =
      useRestTimerStore.getState().completionCount;
    dismissSnackbar(REST_TIMER_COMPLETION_SNACKBAR_KEY);
    stopCompletionSound();
  }, [stopCompletionSound]);

  useRestTimerNotificationResponses({
    onRestTimerNotificationPress: acknowledgeNotificationCompletion
  });

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
        void stopCompletionSound();
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

  useEffect(() => {
    isAudioHostMountedRef.current = true;
    playerRef.current = player;

    return () => {
      isAudioHostMountedRef.current = false;
      completionSoundOperationGenerationRef.current += 1;
      clearCompletionSoundTimeout();
    };
  }, [clearCompletionSoundTimeout, player]);

  useEffect(() => {
    if (status !== 'running') {
      return;
    }

    tick();

    const id = setInterval(() => {
      tick();
    }, 500);

    return () => clearInterval(id);
  }, [status, tick]);

  useEffect(() => {
    if (status !== 'running' || endTime === null) {
      cancelRestTimerNotification().catch(error => {
        console.error('Failed to cancel rest timer notification', error);
      });

      return;
    }

    const seconds = Math.max(1, Math.ceil((endTime - Date.now()) / 1000));

    scheduleRestTimerNotification({ seconds, context }).catch(error => {
      console.error('Failed to schedule rest timer notification', error);
    });

    return () => {
      cancelRestTimerNotification().catch(error => {
        console.error('Failed to cancel rest timer notification', error);
      });
    };
  }, [context, endTime, status]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        tick();

        return;
      }

      stopCompletionSound();
    });

    return () => subscription.remove();
  }, [stopCompletionSound, tick]);

  useEffect(() => {
    const wasSheetOpen = wasSheetOpenRef.current;

    wasSheetOpenRef.current = isSheetOpen;

    if (wasSheetOpen && !isSheetOpen) {
      stopCompletionSound();
    }
  }, [isSheetOpen, stopCompletionSound]);

  useEffect(() => {
    if (completionCount <= lastHandledCompletionCountRef.current) {
      return;
    }

    lastHandledCompletionCountRef.current = completionCount;
    triggerCompletionHaptics();
    void playCompletionSound();

    if (isSheetOpen) {
      return;
    }

    showSnackbar({
      key: REST_TIMER_COMPLETION_SNACKBAR_KEY,
      message: 'Rest time is up',
      actionLabel: 'Dismiss',
      onDismiss: () => {
        stopCompletionSound();
      }
    });
  }, [completionCount, isSheetOpen, playCompletionSound, stopCompletionSound]);

  return null;
}
