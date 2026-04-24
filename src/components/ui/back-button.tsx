import { cn } from '@/src/lib/utils/cn';
import { router } from 'expo-router';
import { ChevronLeftIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { Button } from './button';
import { Icon } from './icon';

type BackButtonVariant = 'icon' | 'text';

interface BackButtonProps {
  variant?: BackButtonVariant;
  children?: ReactNode;
  className?: string;
  onPress?: (event: GestureResponderEvent) => void;
}

export function BackButton({
  variant = 'icon',
  children = 'Go back',
  className,
  onPress
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={handlePress}
      className={cn(
        'border-border bg-card h-11 w-11 items-center justify-center rounded-lg border',
        className
      )}
    >
      <Icon icon={ChevronLeftIcon} size={20} className="text-foreground" />
    </Pressable>
  );
}
