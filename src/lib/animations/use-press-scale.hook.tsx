import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

interface UsePressScaleOptions {
  pressedScale?: number;
}

const DEFAULT_PRESSED_SCALE = 0.97;
const PRESS_EASING = Easing.bezier(0.23, 1, 0.32, 1);

export const usePressScale = (options: UsePressScaleOptions = {}) => {
  const { pressedScale = DEFAULT_PRESSED_SCALE } = options;
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
    onPressIn: () => {
      setPressed(true);
      animateScale(pressedScale, MOTION_DURATION_MS.pressIn);
    },
    onPressOut: () => {
      setPressed(false);
      animateScale(1, MOTION_DURATION_MS.pressOut);
    }
  };
};
