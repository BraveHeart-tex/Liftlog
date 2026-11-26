import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { cn } from '@/src/lib/utils/cn.utils';
import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode
} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  type GestureResponderEvent
} from 'react-native';

type NativePressableProps = Omit<
  ComponentPropsWithoutRef<typeof Pressable>,
  'className' | 'children'
>;

export interface PressableSurfaceProps extends NativePressableProps {
  children: ReactNode;
  containerClassName?: string;
  className?: string;
  pressedClassName?: string;
  pressedScale?: number;
}

const DEFAULT_PRESSED_SCALE = 0.97;
const PRESS_EASING = Easing.bezier(0.23, 1, 0.32, 1);

function usePressScale(pressedScale: number) {
  const reduceMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      scale.stopAnimation();
      scale.setValue(1);
    }

    return () => scale.stopAnimation();
  }, [reduceMotion, scale]);

  const animateScale = (toValue: number, duration: number) => {
    if (reduceMotion) {
      scale.stopAnimation();
      scale.setValue(1);

      return;
    }

    Animated.timing(scale, {
      toValue,
      duration,
      easing: PRESS_EASING,
      useNativeDriver: true
    }).start();
  };

  return {
    pressed,
    scaleStyle: {
      transform: [{ scale }]
    },
    scaleIn: () => {
      setPressed(true);
      animateScale(pressedScale, MOTION_DURATION_MS.pressIn);
    },
    scaleOut: () => {
      setPressed(false);
      animateScale(1, MOTION_DURATION_MS.pressOut);
    }
  };
}

export function PressableSurface({
  children,
  containerClassName,
  className,
  pressedClassName = 'opacity-80',
  disabled = false,
  pressedScale = DEFAULT_PRESSED_SCALE,
  accessibilityRole = 'button',
  accessibilityState,
  onPressIn,
  onPressOut,
  ...props
}: PressableSurfaceProps) {
  const isDisabled = Boolean(disabled);
  const { pressed, scaleStyle, scaleIn, scaleOut } =
    usePressScale(pressedScale);

  const handlePressIn = (event: GestureResponderEvent) => {
    if (isDisabled) {
      return;
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
          isDisabled && 'opacity-50',
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
