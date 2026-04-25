import { useRef, useState } from 'react';
import { Animated } from 'react-native';

interface UsePressScaleOptions {
  pressedScale?: number;
  speed?: number;
  bounciness?: number;
}

const DEFAULT_PRESSED_SCALE = 0.97;
const DEFAULT_SPEED = 30;
const DEFAULT_BOUNCINESS = 0;

export const usePressScale = (options: UsePressScaleOptions = {}) => {
  const {
    pressedScale = DEFAULT_PRESSED_SCALE,
    speed = DEFAULT_SPEED,
    bounciness = DEFAULT_BOUNCINESS
  } = options;
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed,
      bounciness
    }).start();
  };

  return {
    pressed,
    scaleStyle: {
      transform: [{ scale }]
    },
    onPressIn: () => {
      setPressed(true);
      animateScale(pressedScale);
    },
    onPressOut: () => {
      setPressed(false);
      animateScale(1);
    }
  };
};
