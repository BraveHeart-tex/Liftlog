import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import * as Haptics from 'expo-haptics';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Animated, Pressable, type GestureResponderEvent } from 'react-native';

type NativePressableProps = Omit<
  ComponentPropsWithoutRef<typeof Pressable>,
  'className' | 'children'
>;

type HapticFeedback = 'selection' | 'light' | 'medium' | 'heavy';

interface PressableSurfaceProps extends NativePressableProps {
  children: ReactNode;
  containerClassName?: string;
  className?: string;
  pressedClassName?: string;
  disabledClassName?: string;
  hapticFeedback?: HapticFeedback;
  pressedScale?: number;
}

const impactFeedbackStyles: Record<
  Exclude<HapticFeedback, 'selection'>,
  Haptics.ImpactFeedbackStyle
> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy
};

function triggerHapticFeedback(hapticFeedback: HapticFeedback) {
  if (hapticFeedback === 'selection') {
    void Haptics.selectionAsync();

    return;
  }

  void Haptics.impactAsync(impactFeedbackStyles[hapticFeedback]);
}

export function PressableSurface({
  children,
  containerClassName,
  className,
  pressedClassName = 'opacity-80',
  disabledClassName = 'opacity-50',
  disabled = false,
  hapticFeedback,
  pressedScale,
  accessibilityRole = 'button',
  accessibilityState,
  onPressIn,
  onPressOut,
  ...props
}: PressableSurfaceProps) {
  const isDisabled = Boolean(disabled);
  const {
    pressed,
    scaleStyle,
    onPressIn: scaleIn,
    onPressOut: scaleOut
  } = usePressScale({ pressedScale });

  const handlePressIn = (event: GestureResponderEvent) => {
    if (isDisabled) {
      return;
    }

    if (hapticFeedback) {
      triggerHapticFeedback(hapticFeedback);
    }

    scaleIn();
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    scaleOut();
    onPressOut?.(event);
  };

  return (
    <Animated.View className={containerClassName} style={scaleStyle}>
      <Pressable
        accessibilityRole={accessibilityRole}
        accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
        className={cn(
          className,
          isDisabled && disabledClassName,
          pressed && !isDisabled && pressedClassName
        )}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
