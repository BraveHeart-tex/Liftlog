import { Button } from '@/src/components/ui/button';
import { Icon, type IconComponent } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { cn } from '@/src/lib/utils/cn.utils';
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Keyboard,
  PanResponder,
  Platform,
  View
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

const DEFAULT_SNACKBAR_DURATION_MS = 4000;
const SNACKBAR_DEDUPLICATION_WINDOW_MS = 1500;
const SNACKBAR_BOTTOM_OFFSET = 78;
const SNACKBAR_KEYBOARD_TRANSITION_MS = 220;
const SNACKBAR_ENTER_OFFSET = 12;
const SNACKBAR_EXIT_OFFSET = 12;
const SNACKBAR_ENTER_SCALE = 0.985;
const SNACKBAR_EXIT_SCALE = 0.99;
const SWIPE_DISMISS_DISTANCE = 48;
const SWIPE_DISMISS_VELOCITY = 0.75;

export type SnackbarVariant = 'success' | 'info' | 'warning' | 'danger';

export interface SnackbarOptions {
  key?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  onDismiss?: () => void;
  durationMs?: number;
  variant?: SnackbarVariant;
}

interface SnackbarVariantStyles {
  icon: IconComponent;
  iconContainerClassName: string;
}

const snackbarVariantStyles: Record<SnackbarVariant, SnackbarVariantStyles> = {
  success: {
    icon: CircleCheck,
    iconContainerClassName: 'bg-success/15'
  },
  info: {
    icon: Info,
    iconContainerClassName: 'bg-info/15'
  },
  warning: {
    icon: TriangleAlert,
    iconContainerClassName: 'bg-warning/15'
  },
  danger: {
    icon: CircleAlert,
    iconContainerClassName: 'bg-danger/15'
  }
};

type SnackbarMessage = SnackbarOptions & {
  id: number;
};

interface SnackbarState {
  message: SnackbarMessage | null;
  showSnackbar: (options: SnackbarOptions) => void;
  dismissSnackbar: (key?: string) => void;
  dismissSnackbarForId: (id: number) => void;
}

let nextSnackbarId = 1;
let lastSnackbarSignature: string | null = null;
let lastSnackbarShownAt = 0;

function getSnackbarSignature(options: SnackbarOptions) {
  return JSON.stringify([
    options.variant ?? 'info',
    options.message,
    options.actionLabel ?? ''
  ]);
}

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
    const now = Date.now();
    const signature = getSnackbarSignature(options);

    if (
      signature === lastSnackbarSignature &&
      now - lastSnackbarShownAt < SNACKBAR_DEDUPLICATION_WINDOW_MS
    ) {
      return;
    }

    lastSnackbarSignature = signature;
    lastSnackbarShownAt = now;

    const currentMessage = get().message;
    const nextMessage: SnackbarMessage = {
      id: nextSnackbarId++,
      ...options
    };

    set({ message: nextMessage });

    if (currentMessage) {
      notifySnackbarDismissed(currentMessage);
    }
  },
  dismissSnackbar: key => {
    const currentMessage = get().message;

    if (!currentMessage || (key && currentMessage.key !== key)) {
      return;
    }

    set({ message: null });
    notifySnackbarDismissed(currentMessage);
  },
  dismissSnackbarForId: id => {
    const currentMessage = get().message;

    if (!currentMessage || currentMessage.id !== id) {
      return;
    }

    set({ message: null });
    notifySnackbarDismissed(currentMessage);
  }
}));

export function showSnackbar(options: SnackbarOptions) {
  useSnackbarStore.getState().showSnackbar(options);
}

export function dismissSnackbar(key?: string) {
  useSnackbarStore.getState().dismissSnackbar(key);
}

function resetSnackbarDrag(dragY: Animated.Value, reduceMotion: boolean) {
  dragY.stopAnimation();

  if (reduceMotion) {
    dragY.setValue(0);

    return;
  }

  Animated.spring(dragY, {
    toValue: 0,
    damping: 18,
    stiffness: 220,
    useNativeDriver: true
  }).start();
}

export function SnackbarHost() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion() ?? false;
  const message = useSnackbarStore(state => state.message);
  const dismissSnackbar = useSnackbarStore(state => state.dismissSnackbar);
  const dismissSnackbarForId = useSnackbarStore(
    state => state.dismissSnackbarForId
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isActionPending, setIsActionPending] = useState(false);
  const [renderedMessage, setRenderedMessage] =
    useState<SnackbarMessage | null>(message);
  const progress = useRef(new Animated.Value(message ? 1 : 0)).current;
  const entranceOffset = useRef(
    new Animated.Value(reduceMotion ? 0 : message ? 0 : SNACKBAR_ENTER_OFFSET)
  ).current;
  const entranceScale = useRef(
    new Animated.Value(reduceMotion || message ? 1 : SNACKBAR_ENTER_SCALE)
  ).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const reduceMotionRef = useRef(reduceMotion);

  useEffect(() => {
    reduceMotionRef.current = reduceMotion;
  }, [reduceMotion]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.timing(keyboardOffset, {
      toValue: -keyboardHeight,
      duration: SNACKBAR_KEYBOARD_TRANSITION_MS,
      useNativeDriver: true
    });

    animation.start();

    return () => animation.stop();
  }, [keyboardHeight, keyboardOffset]);

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

        resetSnackbarDrag(dragY, reduceMotionRef.current);
      },
      onPanResponderTerminate: () => {
        resetSnackbarDrag(dragY, reduceMotionRef.current);
      }
    })
  ).current;

  useEffect(() => {
    if (!message) {
      progress.stopAnimation();
      entranceOffset.stopAnimation();
      entranceScale.stopAnimation();

      const exitAnimation = Animated.parallel([
        Animated.timing(progress, {
          toValue: 0,
          duration: MOTION_DURATION_MS.exit,
          useNativeDriver: true
        }),
        Animated.timing(entranceOffset, {
          toValue: reduceMotion ? 0 : SNACKBAR_EXIT_OFFSET,
          duration: MOTION_DURATION_MS.exit,
          useNativeDriver: true
        }),
        Animated.timing(entranceScale, {
          toValue: reduceMotion ? 1 : SNACKBAR_EXIT_SCALE,
          duration: MOTION_DURATION_MS.exit,
          useNativeDriver: true
        })
      ]);

      exitAnimation.start(({ finished }) => {
        if (finished && !useSnackbarStore.getState().message) {
          setRenderedMessage(null);
        }
      });

      return () => exitAnimation.stop();
    }

    progress.stopAnimation();
    entranceOffset.stopAnimation();
    entranceScale.stopAnimation();
    setRenderedMessage(message);
    resetSnackbarDrag(dragY, reduceMotion);

    const entranceAnimation = Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: MOTION_DURATION_MS.standard,
        useNativeDriver: true
      }),
      Animated.timing(entranceOffset, {
        toValue: 0,
        duration: MOTION_DURATION_MS.standard,
        useNativeDriver: true
      }),
      Animated.timing(entranceScale, {
        toValue: 1,
        duration: MOTION_DURATION_MS.standard,
        useNativeDriver: true
      })
    ]);

    entranceAnimation.start();

    return () => entranceAnimation.stop();
  }, [dragY, entranceOffset, entranceScale, message, progress, reduceMotion]);

  useEffect(() => {
    setIsActionPending(false);
  }, [message?.id]);

  useEffect(() => {
    if (!message || message.actionLabel) {
      return;
    }

    const timeoutId = setTimeout(
      () => dismissSnackbarForId(message.id),
      message.durationMs ?? DEFAULT_SNACKBAR_DURATION_MS
    );

    return () => clearTimeout(timeoutId);
  }, [dismissSnackbarForId, message]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const messageId = message.id;
    const announcement = [message.message, message.actionLabel]
      .filter(Boolean)
      .join('. ');
    const timeoutId = setTimeout(() => {
      if (useSnackbarStore.getState().message?.id !== messageId) {
        return;
      }

      AccessibilityInfo.announceForAccessibility(announcement);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [message]);

  const handleAction = async () => {
    if (!renderedMessage || isActionPending) {
      return;
    }

    if (!renderedMessage.onAction) {
      dismissSnackbar();

      return;
    }

    const messageId = renderedMessage.id;
    setIsActionPending(true);

    try {
      await renderedMessage.onAction();

      dismissSnackbarForId(messageId);
    } catch (error) {
      console.error('Snackbar action failed', error);
    } finally {
      setIsActionPending(false);
    }
  };

  if (!renderedMessage) {
    return null;
  }

  const variant = renderedMessage.variant ?? 'info';
  const variantStyles = snackbarVariantStyles[variant];
  const StatusIcon = variantStyles.icon;
  const isUrgent = variant === 'danger' || variant === 'warning';
  const dragOpacity = dragY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 1 / 3],
    extrapolate: 'clamp'
  });

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 z-50 px-4"
      style={{ bottom: insets.bottom + SNACKBAR_BOTTOM_OFFSET }}
    >
      <Animated.View
        pointerEvents="box-none"
        style={{ transform: [{ translateY: keyboardOffset }] }}
      >
        <Animated.View
          style={{
            opacity: Animated.multiply(progress, dragOpacity),
            transform: [
              { translateY: entranceOffset },
              { translateY: dragY },
              { scale: entranceScale }
            ]
          }}
        >
          <View
            accessibilityLiveRegion={isUrgent ? 'assertive' : 'polite'}
            accessibilityRole={isUrgent ? 'alert' : undefined}
            className="border-border bg-popover min-h-14 w-full flex-row items-center gap-2.5 rounded-md border py-1.5 pr-2 pl-3.5 shadow-xl"
          >
            <View
              {...panResponder.panHandlers}
              className="min-w-0 flex-1 flex-row items-center gap-2.5"
            >
              <View
                className={cn(
                  'h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  variantStyles.iconContainerClassName
                )}
              >
                <Icon as={StatusIcon} size="sm" tone={variant} />
              </View>
              <Text variant="body" className="min-w-0 flex-1" numberOfLines={2}>
                {renderedMessage.message}
              </Text>
            </View>

            {renderedMessage.actionLabel ? (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 min-w-11 shrink-0 rounded-[10px] px-2.5"
                textClassName="text-primary"
                accessibilityLabel={
                  isActionPending ? 'Retrying' : renderedMessage.actionLabel
                }
                loading={isActionPending}
                loadingLabel="Retrying"
                onPress={handleAction}
              >
                {renderedMessage.actionLabel}
              </Button>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
