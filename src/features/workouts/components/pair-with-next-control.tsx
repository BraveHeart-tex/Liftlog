import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { iconSizes } from '@/src/theme/sizes';
import { LinkIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

const pairControlEaseOut = Easing.bezier(0.23, 1, 0.32, 1);

interface PairWithNextControlProps {
  isReordering: boolean;
  onPress: () => void;
}

export function PairWithNextControl({
  isReordering,
  onPress
}: PairWithNextControlProps) {
  const visibilityProgress = useSharedValue(isReordering ? 0 : 1);

  useEffect(() => {
    visibilityProgress.value = withTiming(isReordering ? 0 : 1, {
      duration: isReordering
        ? MOTION_DURATION_MS.pressOut
        : MOTION_DURATION_MS.pressIn,
      easing: pairControlEaseOut
    });
  }, [isReordering, visibilityProgress]);

  const visibilityStyle = useAnimatedStyle(() => ({
    opacity: visibilityProgress.value
  }));

  return (
    <Animated.View
      pointerEvents={isReordering ? 'none' : 'auto'}
      accessibilityElementsHidden={isReordering}
      importantForAccessibility={isReordering ? 'no-hide-descendants' : 'auto'}
      className="mt-4 ml-12 flex-row items-center gap-3 pb-1"
      style={visibilityStyle}
    >
      <View className="bg-border h-7 w-px" />
      <Button
        variant="secondary"
        size="sm"
        className="min-h-0 rounded-full px-3 py-2"
        textClassName="text-muted-foreground text-sm"
        leftIcon={
          <Icon as={LinkIcon} size={iconSizes.xs} tone="mutedForeground" />
        }
        onPress={onPress}
      >
        Pair with next
      </Button>
    </Animated.View>
  );
}
