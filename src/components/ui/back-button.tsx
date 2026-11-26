import { Button } from '@/src/components/ui/button';
import { Icon, type IconComponent } from '@/src/components/ui/icon';
import { cn } from '@/src/lib/utils/cn.utils';
import { router } from 'expo-router';
import { ChevronLeftIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import type { GestureResponderEvent } from 'react-native';

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
    <Button
      variant="secondary"
      size="icon"
      accessibilityLabel="Go back"
      className={cn('rounded-md', className)}
      onPress={handlePress}
    >
      <Icon as={icon} size="lg" tone="foreground" />
    </Button>
  );
}
