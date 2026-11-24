import { useAppTheme } from '@/src/theme/app-theme-provider';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { cn } from '@/src/lib/utils/cn.utils';
import { useEffect } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

interface SwitchProps extends Omit<PressableProps, 'children'> {
  accessibilityLabel: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const thumbTranslateX = 24;

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  accessibilityState,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: SwitchProps) {
  const { colors } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const checkedProgress = useSharedValue(checked ? 1 : 0);
  const pressProgress = useSharedValue(0);
  const thumbDepthStyle: ViewStyle = {
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 2,
    elevation: 2
  };

  useEffect(() => {
    const nextProgress = checked ? 1 : 0;

    checkedProgress.value = reduceMotion
      ? nextProgress
      : withTiming(nextProgress, {
          duration: MOTION_DURATION_MS.standard
        });
  }, [checked, checkedProgress, reduceMotion]);

  const trackStyle = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        checkedProgress.value,
        [0, 1],
        [colors.muted, colors.primary]
      )
    }),
    [colors.muted, colors.primary]
  );

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: checkedProgress.value * thumbTranslateX },
      { scale: 1 - pressProgress.value * 0.05 }
    ]
  }));

  const handlePress: PressableProps['onPress'] = event => {
    onCheckedChange(!checked);
    onPress?.(event);
  };

  const handlePressIn: PressableProps['onPressIn'] = event => {
    pressProgress.value = reduceMotion
      ? 0
      : withTiming(1, {
          duration: MOTION_DURATION_MS.pressIn
        });
    onPressIn?.(event);
  };

  const handlePressOut: PressableProps['onPressOut'] = event => {
    pressProgress.value = reduceMotion
      ? 0
      : withTiming(0, {
          duration: MOTION_DURATION_MS.pressOut
        });
    onPressOut?.(event);
  };

  return (
    <Pressable
      {...props}
      accessibilityRole="switch"
      accessibilityState={{
        ...accessibilityState,
        checked,
        disabled: !!disabled
      }}
      className={cn(
        'h-12 w-16 items-center justify-center rounded-full',
        disabled && 'opacity-50',
        className
      )}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View className="h-8 w-14 rounded-full p-0.5" style={trackStyle}>
        <Animated.View
          className="border-border bg-primary-foreground h-7 w-7 rounded-full border"
          style={[thumbDepthStyle, thumbStyle]}
        />
      </Animated.View>
    </Pressable>
  );
}
