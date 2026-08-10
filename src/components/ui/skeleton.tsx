import { cn } from '@/src/lib/utils/cn.utils';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const translateX = useSharedValue(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (reduceMotion || width === 0) {
      translateX.value = 0;

      return;
    }

    const shimmerWidth = Math.max(48, width * 0.35);
    const start = -shimmerWidth;

    translateX.value = start;
    translateX.value = withRepeat(
      withTiming(width + shimmerWidth, {
        duration: 1200,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      false
    );
  }, [reduceMotion, translateX, width]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: '12deg' }, { translateX: translateX.value }]
  }));

  return (
    <View
      accessible={false}
      className={cn('bg-muted relative overflow-hidden rounded-md', className)}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
    >
      {!reduceMotion && width > 0 ? (
        <Animated.View
          className="bg-foreground/10 absolute top-0 bottom-0"
          style={[shimmerStyle, { width: Math.max(48, width * 0.35) }]}
        />
      ) : null}
    </View>
  );
}
