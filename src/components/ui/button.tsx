import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';
import type { ReactNode } from 'react';
import { View, type GestureResponderEvent, type TextStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  textClassName?: string;
  children: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
}

const baseClassName = 'flex-row items-center justify-center rounded-lg border';

const sizeClassNames: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 py-3',
  md: 'min-h-12 px-4 py-3',
  lg: 'min-h-14 px-5 py-4',
  icon: 'h-12 w-12'
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-primary border-primary',
  secondary: 'border-border bg-card',
  ghost: 'bg-transparent border-transparent',
  destructive: 'bg-danger border-danger'
};

const textClassNames: Record<ButtonVariant, string> = {
  primary: 'text-body-medium text-primary-foreground',
  secondary: 'text-body-medium text-foreground',
  ghost: 'text-body-medium text-foreground',
  destructive: 'text-body-medium text-danger-foreground'
};

const buttonTextStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold'
};

function getButtonContainerClassName(className?: string) {
  if (!className) {
    return undefined;
  }

  return cn(className.includes('w-full') && 'w-full');
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityLabel,
  leftIcon,
  rightIcon,
  className,
  textClassName,
  children,
  onPress
}: ButtonProps) {
  const isBlocked = disabled || loading;
  const isIconButton = size === 'icon';
  const label =
    typeof children === 'string' || typeof children === 'number'
      ? children
      : null;

  return (
    <PressableSurface
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: loading }}
      containerClassName={getButtonContainerClassName(className)}
      className={cn(
        baseClassName,
        sizeClassNames[size],
        variantClassNames[variant],
        className
      )}
      disabled={isBlocked}
      onPress={onPress}
    >
      {loading ? (
        <Text
          tone="inherit"
          className={cn(textClassNames[variant], textClassName)}
          style={buttonTextStyle}
        >
          Loading...
        </Text>
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {leftIcon}
          {label !== null ? (
            <Text
              tone="inherit"
              className={cn(
                textClassNames[variant],
                isIconButton && 'text-h3',
                textClassName
              )}
              style={buttonTextStyle}
            >
              {label}
            </Text>
          ) : (
            children
          )}
          {rightIcon}
        </View>
      )}
    </PressableSurface>
  );
}
