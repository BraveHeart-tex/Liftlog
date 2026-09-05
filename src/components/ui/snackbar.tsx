import { Button } from '@/src/components/ui/button';
import { Icon, type IconComponent } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
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
  Easing,
  Keyboard,
  PanResponder,
  Platform,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

const DEFAULT_SNACKBAR_DURATION_MS = 4000;
const SNACKBAR_DEDUPLICATION_WINDOW_MS = 1500;
const SNACKBAR_BOTTOM_OFFSET = 16;
const SNACKBAR_KEYBOARD_TRANSITION_MS = 220;
const SNACKBAR_ENTER_OFFSET = 12;
const SNACKBAR_EXIT_OFFSET = 12;
const SNACKBAR_EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const SNACKBAR_DISMISS_EXTRA_OFFSET = 24;
const SNACKBAR_FALLBACK_HEIGHT = 56;
const SWIPE_DISMISS_DISTANCE = 48;
const SWIPE_DISMISS_VELOCITY = 0.75;

interface SnackbarKeyboardAnimation {
  duration: number;
  easing: (value: number) => number;
}

const FALLBACK_SNACKBAR_KEYBOARD_ANIMATION: SnackbarKeyboardAnimation = {
  duration: SNACKBAR_KEYBOARD_TRANSITION_MS,
  easing: Easing.inOut(Easing.ease)
};

function getSnackbarKeyboardEasing(easing?: string) {
  switch (easing) {
    case 'linear':
      return Easing.linear;
    case 'easeIn':
      return Easing.in(Easing.ease);
    case 'easeOut':
      return Easing.out(Easing.ease);
    case 'easeInEaseOut':
      return Easing.inOut(Easing.ease);
    default:
      return FALLBACK_SNACKBAR_KEYBOARD_ANIMATION.easing;
  }
}

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
  const [snackbarHeight, setSnackbarHeight] = useState(0);
  const [isActionPending, setIsActionPending] = useState(false);
  const [renderedMessage, setRenderedMessage] =
    useState<SnackbarMessage | null>(message);
  const progress = useRef(new Animated.Value(message ? 1 : 0)).current;
  const entranceOffset = useRef(
    new Animated.Value(reduceMotion ? 0 : message ? 0 : SNACKBAR_ENTER_OFFSET)
  ).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const snackbarHeightRef = useRef(0);
  const swipeDismissTargetRef = useRef<number | null>(null);
  const swipeDismissVelocityRef = useRef(0);
  const reduceMotionRef = useRef(reduceMotion);
  const keyboardAnimationRef = useRef<SnackbarKeyboardAnimation>(
    FALLBACK_SNACKBAR_KEYBOARD_ANIMATION
  );

  useEffect(() => {
    reduceMotionRef.current = reduceMotion;
  }, [reduceMotion]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, event => {
      if (Platform.OS === 'ios') {
        keyboardAnimationRef.current = {
          duration:
            typeof event.duration === 'number' && event.duration >= 0
              ? event.duration
              : FALLBACK_SNACKBAR_KEYBOARD_ANIMATION.duration,
          easing: getSnackbarKeyboardEasing(event.easing)
        };
      } else {
        keyboardAnimationRef.current = {
          duration: 0,
          easing: Easing.linear
        };
      }

      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, event => {
      if (Platform.OS === 'ios') {
        keyboardAnimationRef.current = {
          duration:
            typeof event.duration === 'number' && event.duration >= 0
              ? event.duration
              : FALLBACK_SNACKBAR_KEYBOARD_ANIMATION.duration,
          easing: getSnackbarKeyboardEasing(event.easing)
        };
      } else {
        keyboardAnimationRef.current = {
          duration: 0,
          easing: Easing.linear
        };
      }

      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    keyboardOffset.stopAnimation();

    if (reduceMotion || keyboardAnimationRef.current.duration === 0) {
      keyboardOffset.setValue(-keyboardHeight);

      return;
    }

    const animation = Animated.timing(keyboardOffset, {
      toValue: -keyboardHeight,
      ...keyboardAnimationRef.current,
      useNativeDriver: true
    });

    animation.start();

    return () => animation.stop();
  }, [keyboardHeight, keyboardOffset, reduceMotion]);

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
          const effectiveHeight = Math.max(
            snackbarHeightRef.current,
            snackbarHeight,
            SNACKBAR_FALLBACK_HEIGHT
          );

          swipeDismissTargetRef.current =
            gestureState.dy + effectiveHeight + SNACKBAR_DISMISS_EXTRA_OFFSET;
          swipeDismissVelocityRef.current = Math.max(0, gestureState.vy);
          dismissSnackbar();

          return;
        }

        swipeDismissTargetRef.current = null;
        swipeDismissVelocityRef.current = 0;
        resetSnackbarDrag(dragY, reduceMotionRef.current);
      },
      onPanResponderTerminate: () => {
        swipeDismissTargetRef.current = null;
        swipeDismissVelocityRef.current = 0;
        resetSnackbarDrag(dragY, reduceMotionRef.current);
      }
    })
  ).current;

  useEffect(() => {
    if (!message) {
      const swipeDismissTarget = swipeDismissTargetRef.current;
      const swipeDismissVelocity = swipeDismissVelocityRef.current;
      swipeDismissTargetRef.current = null;
      swipeDismissVelocityRef.current = 0;

      progress.stopAnimation();
      entranceOffset.stopAnimation();

      const exitAnimations = [
        Animated.timing(progress, {
          toValue: 0,
          duration: reduceMotion ? 0 : MOTION_DURATION_MS.exit,
          easing: SNACKBAR_EASE_OUT,
          useNativeDriver: true
        }),
        Animated.timing(entranceOffset, {
          toValue: reduceMotion ? 0 : SNACKBAR_EXIT_OFFSET,
          duration: reduceMotion ? 0 : MOTION_DURATION_MS.exit,
          easing: SNACKBAR_EASE_OUT,
          useNativeDriver: true
        })
      ];

      if (reduceMotion) {
        dragY.stopAnimation();
        dragY.setValue(0);
      } else if (swipeDismissTarget !== null) {
        exitAnimations.push(
          Animated.spring(dragY, {
            toValue: swipeDismissTarget,
            velocity: swipeDismissVelocity,
            damping: 18,
            stiffness: 220,
            useNativeDriver: true
          })
        );
      } else {
        exitAnimations.push(
          Animated.timing(dragY, {
            toValue: 0,
            duration: MOTION_DURATION_MS.exit,
            easing: SNACKBAR_EASE_OUT,
            useNativeDriver: true
          })
        );
      }

      const exitAnimation = Animated.parallel(exitAnimations);

      exitAnimation.start(({ finished }) => {
        if (finished && !useSnackbarStore.getState().message) {
          setRenderedMessage(null);
        }
      });

      return () => exitAnimation.stop();
    }

    progress.stopAnimation();
    entranceOffset.stopAnimation();
    setRenderedMessage(message);
    resetSnackbarDrag(dragY, reduceMotion);

    const entranceAnimation = Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: reduceMotion ? 0 : MOTION_DURATION_MS.standard,
        easing: SNACKBAR_EASE_OUT,
        useNativeDriver: true
      }),
      Animated.timing(entranceOffset, {
        toValue: 0,
        duration: reduceMotion ? 0 : MOTION_DURATION_MS.standard,
        easing: SNACKBAR_EASE_OUT,
        useNativeDriver: true
      })
    ]);

    entranceAnimation.start();

    return () => entranceAnimation.stop();
  }, [dragY, entranceOffset, message, progress, reduceMotion]);

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
            transform: [{ translateY: entranceOffset }, { translateY: dragY }]
          }}
        >
          <View
            onLayout={event => {
              const height = event.nativeEvent.layout.height;

              snackbarHeightRef.current = height;
              setSnackbarHeight(height);
            }}
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
