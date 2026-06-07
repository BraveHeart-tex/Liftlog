import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

export const PulsatingDot = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2.2, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      false // don't reverse — let it reset and repeat, like a sonar ping
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  return (
    <View className="justify-content h-2 w-2 items-center">
      {/* expanding ring */}
      <Animated.View
        className="bg-primary absolute h-2 w-2 rounded-full"
        style={ringStyle}
      />
      {/* static center dot */}
      <View className="bg-primary h-2 w-2 rounded-full" />
    </View>
  );
};
