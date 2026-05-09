import { showSnackbar } from '@/src/components/ui/snackbar';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer-store';
import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

function triggerSuccessHaptics() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    error => {
      console.error('Failed to trigger rest timer completion haptics', error);
    }
  );

  setTimeout(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(error => {
      console.error('Failed to trigger rest timer impact haptics', error);
    });
  }, 200);

  setTimeout(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(error => {
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
  const player = useAudioPlayer(
    require('@/src/assets/sounds/rest-complete.mp3'),
    {
      downloadFirst: true,
      keepAudioSessionActive: true
    }
  );

  const playCompletionSound = useCallback(async () => {
    try {
      await setIsAudioActiveAsync(true);
      await player.seekTo(0);
      player.volume = 1;
      player.play();
    } catch (error) {
      console.error('Failed to play rest timer completion sound', error);
    }
  }, [player]);

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
      }
    });

    return () => subscription.remove();
  }, [tick]);

  useEffect(() => {
    if (completionCount <= lastHandledCompletionCountRef.current) {
      return;
    }

    lastHandledCompletionCountRef.current = completionCount;
    triggerSuccessHaptics();
    void playCompletionSound();

    if (isSheetOpen) {
      return;
    }

    showSnackbar({
      message: 'Rest time is up',
      actionLabel: 'Dismiss'
    });
  }, [completionCount, isSheetOpen, playCompletionSound]);

  return null;
}
