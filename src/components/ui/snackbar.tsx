import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

const DEFAULT_SNACKBAR_DURATION_MS = 4000;
const SNACKBAR_BOTTOM_OFFSET = 88;
const SWIPE_DISMISS_DISTANCE = 48;
const SWIPE_DISMISS_VELOCITY = 0.75;

interface SnackbarOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  durationMs?: number;
}

type SnackbarMessage = SnackbarOptions & {
  id: number;
};

interface SnackbarState {
  message: SnackbarMessage | null;
  showSnackbar: (options: SnackbarOptions) => void;
  dismissSnackbar: () => void;
}

let nextSnackbarId = 1;

function notifySnackbarDismissed(message: SnackbarMessage) {
  try {
    message.onDismiss?.();
  } catch (error) {
    console.error('Snackbar dismissal callback failed', error);
  }
}

const useSnackbarStore = create<SnackbarState>((set, get) => ({
  message: null,
  showSnackbar: options => {
    const currentMessage = get().message;

    set({
      message: {
        id: nextSnackbarId,
        ...options
      }
    });

    if (currentMessage) {
      notifySnackbarDismissed(currentMessage);
    }

    nextSnackbarId += 1;
  },
  dismissSnackbar: () => {
    const currentMessage = get().message;

    if (!currentMessage) {
      return;
    }

    set({ message: null });
    notifySnackbarDismissed(currentMessage);
  }
}));

export function showSnackbar(options: SnackbarOptions) {
  useSnackbarStore.getState().showSnackbar(options);
}

export function SnackbarHost() {
  const insets = useSafeAreaInsets();
  const message = useSnackbarStore(state => state.message);
  const dismissSnackbar = useSnackbarStore(state => state.dismissSnackbar);
  const [renderedMessage, setRenderedMessage] =
    useState<SnackbarMessage | null>(message);
  const progress = useRef(new Animated.Value(message ? 1 : 0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 8 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        dragY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldDismiss =
          gestureState.dy > SWIPE_DISMISS_DISTANCE ||
          gestureState.vy > SWIPE_DISMISS_VELOCITY;

        if (shouldDismiss) {
          dismissSnackbar();

          return;
        }

        Animated.spring(dragY, {
          toValue: 0,
          damping: 18,
          stiffness: 220,
          useNativeDriver: true
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          damping: 18,
          stiffness: 220,
          useNativeDriver: true
        }).start();
      }
    })
  ).current;

  useEffect(() => {
    if (!message) {
      Animated.timing(progress, {
        toValue: 0,
        duration: MOTION_DURATION_MS.exit,
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished) {
          setRenderedMessage(null);
        }
      });

      return;
    }

    setRenderedMessage(message);
    progress.setValue(0);
    dragY.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      damping: 18,
      stiffness: 220,
      mass: 0.8,
      useNativeDriver: true
    }).start();

    const timeoutId = setTimeout(
      dismissSnackbar,
      message.durationMs ?? DEFAULT_SNACKBAR_DURATION_MS
    );

    return () => clearTimeout(timeoutId);
  }, [dismissSnackbar, dragY, message, progress]);

  if (!renderedMessage) {
    return null;
  }

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0]
  });
  const animatedTranslateY = Animated.add(translateY, dragY);

  const handleAction = () => {
    renderedMessage.onAction?.();
    dismissSnackbar();
  };

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 z-50 px-4"
      style={{ bottom: insets.bottom + SNACKBAR_BOTTOM_OFFSET }}
    >
      <Animated.View
        style={{
          opacity: progress,
          transform: [{ translateY: animatedTranslateY }]
        }}
        {...panResponder.panHandlers}
      >
        <View className="border-border bg-card flex-row items-center gap-3 rounded-md border px-4 py-3 shadow-lg">
          <View className="bg-primary h-8 w-1 rounded-sm" />
          <Text variant="bodyMedium" className="flex-1" numberOfLines={2}>
            {renderedMessage.message}
          </Text>

          {renderedMessage.actionLabel ? (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-0 px-2 py-1"
              textClassName="text-primary"
              onPress={handleAction}
            >
              {renderedMessage.actionLabel}
            </Button>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
