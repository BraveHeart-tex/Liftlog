import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
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
}

const PADDING = 4;

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
  indicatorClassName
}: SegmentedControlProps<T>) {
  const [width, setWidth] = useState(0);
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
  const itemWidth = trackWidth / options.length;

  useEffect(() => {
    translateX.value = withTiming(activeIndex * itemWidth, { duration: 180 });
  }, [activeIndex, itemWidth, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: itemWidth,
    transform: [{ translateX: translateX.value }]
  }));

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      onLayout={handleLayout}
      className={cn('bg-input relative flex-row rounded-xl p-1', className)}
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
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(option.value)}
            className="min-h-10 flex-1 items-center justify-center px-4"
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
