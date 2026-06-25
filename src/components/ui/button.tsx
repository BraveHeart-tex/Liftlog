import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';
import { appFonts } from '@/src/theme/fonts';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { View, type GestureResponderEvent, type TextStyle } from 'react-native';

const buttonVariantConfig = cva(
  'flex-row items-center justify-center rounded-lg border',
  {
    variants: {
      variant: {
        primary: 'bg-primary border-primary disabled:border-primary/50',
        secondary: 'border-border bg-card disabled:border-border/50',
        ghost: 'border-transparent bg-transparent',
        destructive: 'border-border bg-card disabled:border-border/50'
      },
      size: {
        sm: 'min-h-11 px-3 py-3',
        md: 'min-h-12 px-4 py-3',
        lg: 'min-h-14 px-5 py-4',
        icon: 'h-12 w-12'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

type ButtonVariants = VariantProps<typeof buttonVariantConfig>;

export const buttonVariants = (variants: ButtonVariants = {}) =>
  cn(buttonVariantConfig(variants));

type ButtonVariant = NonNullable<ButtonVariants['variant']>;

type ButtonSize = NonNullable<ButtonVariants['size']>;

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
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
}

const buttonTextVariants = cva('text-body-medium', {
  variants: {
    variant: {
      primary: 'text-primary-foreground',
      secondary: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-danger'
    },
    icon: {
      true: 'text-h3'
    }
  },
  defaultVariants: {
    variant: 'primary',
    icon: false
  }
});

const buttonTextStyle: TextStyle = {
  fontFamily: appFonts.faces.semiBold
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
  onPress,
  onPressIn,
  onPressOut
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
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isBlocked}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      {loading ? (
        <Text
          tone="inherit"
          className={cn(buttonTextVariants({ variant }), textClassName)}
          style={buttonTextStyle}
        >
          Loading...
        </Text>
      ) : (
        <View className="flex-row items-center justify-center gap-1">
          {leftIcon}
          {label !== null ? (
            <Text
              tone="inherit"
              className={cn(
                buttonTextVariants({ variant, icon: isIconButton }),
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
