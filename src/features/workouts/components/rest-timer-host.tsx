import { showSnackbar } from '@/src/components/ui/snackbar';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer.store';
import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer
} from 'expo-audio';
import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync
} from 'expo-haptics';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const REST_TIMER_COMPLETION_SOUND_DURATION_MS = 5000;

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
  const completionCount = useRestTimerStore(state => state.completionCount);
  const isSheetOpen = useRestTimerStore(state => state.isSheetOpen);
  const tick = useRestTimerStore(state => state.tick);
  const lastHandledCompletionCountRef = useRef(completionCount);
  const completionSoundTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const player = useAudioPlayer(
    require('@/assets/sounds/rest-timer-finished.wav'),
    {
      downloadFirst: true,
      keepAudioSessionActive: true
    }
  );

  const stopCompletionSound = useCallback(async () => {
    try {
      if (completionSoundTimeoutRef.current) {
        clearTimeout(completionSoundTimeoutRef.current);
        completionSoundTimeoutRef.current = null;
      }

      player.pause();
      player.loop = false;
      await player.seekTo(0);
    } catch (error) {
      console.error('Failed to stop rest timer completion sound', error);
    }
  }, [player]);

  const playCompletionSound = useCallback(async () => {
    try {
      if (completionSoundTimeoutRef.current) {
        clearTimeout(completionSoundTimeoutRef.current);
        completionSoundTimeoutRef.current = null;
      }

      await setIsAudioActiveAsync(true);
      await player.seekTo(0);
      player.loop = true;
      player.volume = 1;
      player.play();
      completionSoundTimeoutRef.current = setTimeout(() => {
        completionSoundTimeoutRef.current = null;
        void stopCompletionSound();
      }, REST_TIMER_COMPLETION_SOUND_DURATION_MS);
    } catch (error) {
      console.error('Failed to play rest timer completion sound', error);
    }
  }, [player, stopCompletionSound]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers'
    }).catch(error => {
      console.error('Failed to configure rest timer audio mode', error);
    });
  }, []);

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
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        tick();

        return;
      }

      void stopCompletionSound();
    });

    return () => subscription.remove();
  }, [stopCompletionSound, tick]);

  useEffect(() => {
    return () => {
      void stopCompletionSound();
    };
  }, [stopCompletionSound]);

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
      message: 'Rest time is up',
      actionLabel: 'Dismiss',
      onDismiss: () => {
        void stopCompletionSound();
      }
    });
  }, [completionCount, isSheetOpen, playCompletionSound, stopCompletionSound]);

  return null;
}
