import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

interface UsePressScaleOptions {
  pressedScale?: number;
  speed?: number;
  bounciness?: number;
  pressInDelayMs?: number;
}

const DEFAULT_PRESSED_SCALE = 0.97;
const DEFAULT_SPEED = 30;
const DEFAULT_BOUNCINESS = 0;
const DEFAULT_PRESS_IN_DELAY_MS = 75;

export const usePressScale = (options: UsePressScaleOptions = {}) => {
  const {
    pressedScale = DEFAULT_PRESSED_SCALE,
    speed = DEFAULT_SPEED,
    bounciness = DEFAULT_BOUNCINESS,
    pressInDelayMs = DEFAULT_PRESS_IN_DELAY_MS
  } = options;
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const pressInTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pressInTimeoutRef.current !== null) {
        clearTimeout(pressInTimeoutRef.current);
      }
    };
  }, []);

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed,
      bounciness
    }).start();
  };

  const clearPendingPressIn = () => {
    if (pressInTimeoutRef.current === null) {
      return;
    }

    clearTimeout(pressInTimeoutRef.current);
    pressInTimeoutRef.current = null;
  };

  return {
    pressed,
    scaleStyle: {
      transform: [{ scale }]
    },
    onPressIn: () => {
      clearPendingPressIn();

      pressInTimeoutRef.current = setTimeout(() => {
        setPressed(true);
        animateScale(pressedScale);
        pressInTimeoutRef.current = null;
      }, pressInDelayMs);
    },
    onPressOut: () => {
      clearPendingPressIn();
      setPressed(false);
      animateScale(1);
    }
  };
};
