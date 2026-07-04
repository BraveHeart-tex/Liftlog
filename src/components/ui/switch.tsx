import { useAppTheme } from '@/src/theme/app-theme-provider';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion';
import { cn } from '@/src/lib/utils/cn';
import { useEffect } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const thumbTranslateX = 24;

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className
}: SwitchProps) {
  const { colors } = useAppTheme();
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
    checkedProgress.value = withTiming(checked ? 1 : 0, {
      duration: MOTION_DURATION_MS.standard
    });
  }, [checked, checkedProgress]);

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

  const handlePress = () => {
    onCheckedChange(!checked);
  };

  const handlePressIn = () => {
    pressProgress.value = withTiming(1, {
      duration: MOTION_DURATION_MS.pressIn
    });
  };

  const handlePressOut = () => {
    pressProgress.value = withTiming(0, {
      duration: MOTION_DURATION_MS.pressOut
    });
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      className={cn(
        'h-11 w-16 items-center justify-center rounded-full',
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
