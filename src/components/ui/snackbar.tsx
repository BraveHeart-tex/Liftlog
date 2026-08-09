import { Button } from '@/src/components/ui/button';
import { Icon, type IconComponent } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { cn } from '@/src/lib/utils/cn.utils';
import {
  CircleCheck,
  CircleX,
  Info,
  TriangleAlert,
  X
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, PanResponder, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

const DEFAULT_SNACKBAR_DURATION_MS = 4000;
const SNACKBAR_BOTTOM_OFFSET = 88;
const SWIPE_DISMISS_DISTANCE = 48;
const SWIPE_DISMISS_VELOCITY = 0.75;

export type SnackbarVariant = 'success' | 'info' | 'warning' | 'danger';

interface SnackbarOptions {
  key?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  durationMs?: number;
  variant?: SnackbarVariant;
}

interface SnackbarVariantStyles {
  borderClassName: string;
  indicatorClassName: string;
  iconContainerClassName: string;
  icon: IconComponent;
  actionTextClassName: string;
}

const snackbarVariantStyles: Record<SnackbarVariant, SnackbarVariantStyles> = {
  success: {
    borderClassName: 'border-success/40',
    indicatorClassName: 'bg-success',
    iconContainerClassName: 'bg-success/15 border-success/25',
    icon: CircleCheck,
    actionTextClassName: 'text-success'
  },
  info: {
    borderClassName: 'border-info/40',
    indicatorClassName: 'bg-info',
    iconContainerClassName: 'bg-info/15 border-info/25',
    icon: Info,
    actionTextClassName: 'text-info'
  },
  warning: {
    borderClassName: 'border-warning/40',
    indicatorClassName: 'bg-warning',
    iconContainerClassName: 'bg-warning/15 border-warning/25',
    icon: TriangleAlert,
    actionTextClassName: 'text-warning'
  },
  danger: {
    borderClassName: 'border-danger/40',
    indicatorClassName: 'bg-danger',
    iconContainerClassName: 'bg-danger/15 border-danger/25',
    icon: CircleX,
    actionTextClassName: 'text-danger'
  }
};

const snackbarAnnouncementLabels: Record<SnackbarVariant, string> = {
  success: 'Success',
  info: 'Information',
  warning: 'Warning',
  danger: 'Error'
};

type SnackbarMessage = SnackbarOptions & {
  id: number;
};

interface SnackbarState {
  message: SnackbarMessage | null;
  showSnackbar: (options: SnackbarOptions) => void;
  dismissSnackbar: (key?: string) => void;
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
  dismissSnackbar: key => {
    const currentMessage = get().message;

    if (!currentMessage) {
      return;
    }

    if (key && currentMessage.key !== key) {
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
      return;
    }

    const messageId = message.id;
    const variant = message.variant ?? 'info';
    const announcement = [
      snackbarAnnouncementLabels[variant],
      message.message,
      message.actionLabel
    ]
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

  useEffect(() => {
    progress.stopAnimation();

    if (!message) {
      Animated.timing(progress, {
        toValue: 0,
        duration: MOTION_DURATION_MS.exit,
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished && !useSnackbarStore.getState().message) {
          setRenderedMessage(null);
        }
      });

      return;
    }

    setRenderedMessage(message);
    progress.setValue(0);
    dragY.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: MOTION_DURATION_MS.standard,
      useNativeDriver: true
    }).start();

    const timeoutId = setTimeout(
      dismissSnackbar,
      message.durationMs ?? DEFAULT_SNACKBAR_DURATION_MS
    );

    return () => {
      clearTimeout(timeoutId);
      progress.stopAnimation();
    };
  }, [dismissSnackbar, dragY, message, progress]);

  if (!renderedMessage) {
    return null;
  }

  const handleAction = () => {
    renderedMessage.onAction?.();
    dismissSnackbar();
  };

  const variant = renderedMessage.variant ?? 'info';
  const variantStyles = snackbarVariantStyles[variant];
  const StatusIcon = variantStyles.icon;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 z-50 px-4"
      style={{ bottom: insets.bottom + SNACKBAR_BOTTOM_OFFSET }}
    >
      <Animated.View
        style={{
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0]
              })
            },
            { translateY: dragY }
          ]
        }}
        {...panResponder.panHandlers}
      >
        <View
          className={cn(
            'bg-popover flex-row items-center gap-3 rounded-lg border px-3 py-2 shadow-xl',
            variantStyles.borderClassName
          )}
        >
          <View
            className={cn(
              'h-9 w-1.5 shrink-0 rounded-sm',
              variantStyles.indicatorClassName
            )}
          />
          <View
            className={cn(
              'h-8 w-8 shrink-0 items-center justify-center rounded-md border',
              variantStyles.iconContainerClassName
            )}
          >
            <Icon as={StatusIcon} size="sm" tone={variant} />
          </View>
          <Text
            variant="bodyMedium"
            className="min-w-0 flex-1"
            numberOfLines={2}
          >
            {renderedMessage.message}
          </Text>

          {renderedMessage.actionLabel ? (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 px-2"
              textClassName={variantStyles.actionTextClassName}
              onPress={handleAction}
            >
              {renderedMessage.actionLabel}
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            accessibilityLabel="Dismiss notification"
            onPress={() => dismissSnackbar()}
          >
            <Icon as={X} size="md" tone="mutedForeground" strokeWidth={2.25} />
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}
