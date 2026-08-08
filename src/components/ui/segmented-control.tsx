import { Text } from '@/src/components/ui/text';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { triggerSegmentSelectionHaptics } from '@/src/lib/haptics/navigation.haptics';
import { cn } from '@/src/lib/utils/cn.utils';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useReducedMotion
} from 'react-native-reanimated';

interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  indicatorClassName?: string;
  accessibilityMode?: 'tabs' | 'radioGroup';
}

const PADDING = 4;

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
  indicatorClassName,
  accessibilityMode = 'tabs'
}: SegmentedControlProps<T>) {
  const [width, setWidth] = useState(0);
  const [pressedValue, setPressedValue] = useState<T | null>(null);
  const reduceMotion = useReducedMotion();
  const translateX = useSharedValue(0);

  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        options.findIndex(option => option.value === value)
      ),
    [options, value]
  );

  const trackWidth = width - PADDING * 2;
  const itemWidth = options.length > 0 ? trackWidth / options.length : 0;

  useEffect(() => {
    const nextTranslateX = activeIndex * itemWidth;

    translateX.value = reduceMotion
      ? nextTranslateX
      : withTiming(nextTranslateX, {
          duration: MOTION_DURATION_MS.standard
        });
  }, [activeIndex, itemWidth, reduceMotion, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: itemWidth,
    transform: [{ translateX: translateX.value }]
  }));

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;

    if (nextWidth <= 0) {
      return;
    }

    setWidth(nextWidth);
  }

  function handleOptionPress(optionValue: T) {
    if (optionValue === value) {
      return;
    }

    triggerSegmentSelectionHaptics();
    onChange(optionValue);
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <View
      onLayout={handleLayout}
      accessibilityRole={
        accessibilityMode === 'tabs' ? 'tablist' : 'radiogroup'
      }
      className={cn('bg-input relative flex-row rounded-md p-1', className)}
    >
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          className={cn(
            'bg-secondary absolute top-1 bottom-1 left-1 rounded-md',
            indicatorClassName
          )}
          style={indicatorStyle}
        />
      ) : null}
      {options.map(option => {
        const isActive = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole={accessibilityMode === 'tabs' ? 'tab' : 'radio'}
            accessibilityState={{ selected: isActive }}
            onPress={() => handleOptionPress(option.value)}
            onPressIn={() => setPressedValue(option.value)}
            onPressOut={() => setPressedValue(null)}
            className={cn(
              'min-h-12 flex-1 items-center justify-center rounded-md px-4',
              pressedValue === option.value && !isActive && 'opacity-70'
            )}
          >
            <Text
              variant="bodyMedium"
              className={isActive ? 'text-foreground' : 'text-muted-foreground'}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
