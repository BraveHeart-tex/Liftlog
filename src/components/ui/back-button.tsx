import { Button } from '@/src/components/ui/button';
import { Icon, type IconComponent } from '@/src/components/ui/icon';
import { usePressScale } from '@/src/lib/animations/use-press-scale.hook';
import { cn } from '@/src/lib/utils/cn.utils';
import { router } from 'expo-router';
import { ChevronLeftIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Animated, Pressable, type GestureResponderEvent } from 'react-native';

type BackButtonVariant = 'icon' | 'text';

interface BackButtonProps {
  variant?: BackButtonVariant;
  children?: ReactNode;
  className?: string;
  onPress?: (event: GestureResponderEvent) => void;
  icon?: IconComponent;
}

export function BackButton({
  variant = 'icon',
  children = 'Go back',
  className,
  onPress,
  icon = ChevronLeftIcon
}: BackButtonProps) {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      onPress(event);

      return;
    }

    router.back();
  };

  if (variant === 'text') {
    return (
      <Button className={className} onPress={handlePress}>
        {children}
      </Button>
    );
  }

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className={cn(
          'border-border bg-card h-12 w-12 items-center justify-center rounded-md border',
          pressed && 'opacity-80',
          className
        )}
      >
        <Icon as={icon} size="lg" tone="foreground" />
      </Pressable>
    </Animated.View>
  );
}
