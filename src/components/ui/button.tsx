import { StyledActivityIndicator } from '@/src/components/styled/activity-indicator';
import {
  PressableSurface,
  type PressableSurfaceProps
} from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn.utils';
import { appFonts } from '@/src/theme/fonts';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { View, type StyleProp, type TextStyle } from 'react-native';

const buttonVariantConfig = cva(
  'flex-row items-center justify-center rounded-lg border',
  {
    variants: {
      variant: {
        primary: 'bg-primary border-primary disabled:border-transparent',
        secondary: 'border-border bg-card disabled:border-transparent',
        ghost: 'border-transparent bg-transparent',
        destructive:
          'border-danger/30 bg-danger/10 disabled:border-transparent disabled:bg-danger/5'
      },
      size: {
        sm: 'min-h-12 px-3 py-3',
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

const buttonVariants = (variants: ButtonVariants = {}) =>
  cn(buttonVariantConfig(variants));

type ButtonVariant = NonNullable<ButtonVariants['variant']>;

type ButtonSize = NonNullable<ButtonVariants['size']>;

interface ButtonProps extends Omit<PressableSurfaceProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  textClassName?: string;
  textStyle?: StyleProp<TextStyle>;
  children: ReactNode;
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

const buttonSpinnerVariants = cva('', {
  variants: {
    variant: {
      primary: 'text-primary-foreground',
      secondary: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-danger'
    }
  },
  defaultVariants: {
    variant: 'primary'
  }
});

const buttonTextStyle: TextStyle = {
  fontFamily: appFonts.faces.semiBold
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  loadingLabel = 'Loading...',
  fullWidth = false,
  accessibilityLabel,
  accessibilityState,
  leftIcon,
  rightIcon,
  className,
  containerClassName,
  textClassName,
  textStyle,
  children,
  pressedClassName,
  ...pressableProps
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
      accessibilityState={{ ...accessibilityState, busy: loading }}
      containerClassName={cn(fullWidth && 'w-full', containerClassName)}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isBlocked}
      pressedClassName={cn(
        pressedClassName ??
          (variant === 'destructive' ? 'bg-danger/15' : 'opacity-80')
      )}
      {...pressableProps}
    >
      {loading ? (
        <View className="flex-row items-center justify-center gap-2">
          <StyledActivityIndicator
            className={cn(buttonSpinnerVariants({ variant }))}
            size="small"
          />
          {isIconButton ? null : (
            <Text
              tone="inherit"
              className={cn(buttonTextVariants({ variant }), textClassName)}
              style={[buttonTextStyle, textStyle]}
            >
              {loadingLabel}
            </Text>
          )}
        </View>
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {leftIcon}
          {label !== null ? (
            <Text
              tone="inherit"
              className={cn(
                buttonTextVariants({ variant, icon: isIconButton }),
                textClassName
              )}
              style={[buttonTextStyle, textStyle]}
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
