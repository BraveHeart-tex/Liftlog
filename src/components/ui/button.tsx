import { cn } from '@/src/lib/utils/cn';
import { useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type TextStyle
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  textClassName?: string;
  children: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
};

const baseClassName = 'flex-row items-center justify-center rounded-lg border';

const sizeClassNames: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 py-3',
  md: 'min-h-12 px-4 py-3',
  lg: 'min-h-14 px-5 py-4',
  icon: 'h-12 w-12'
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'border border-border bg-card',
  ghost: 'bg-transparent',
  destructive: 'bg-danger border-danger'
};

const textClassNames: Record<ButtonVariant, string> = {
  primary: 'text-body-medium text-primary-foreground',
  secondary: 'text-body-medium text-foreground',
  ghost: 'text-body-medium text-foreground',
  destructive: 'text-body-medium text-foreground'
};

const textStyle: TextStyle = {
  includeFontPadding: false,
  textAlignVertical: 'center'
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  className,
  textClassName,
  children,
  onPress
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const isBlocked = disabled || loading;
  const isIconButton = size === 'icon';
  const label =
    typeof children === 'string' || typeof children === 'number'
      ? children
      : null;

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        className={cn(
          baseClassName,
          sizeClassNames[size],
          variantClassNames[variant],
          isBlocked && 'opacity-50',
          pressed && !isBlocked && 'opacity-80',
          className
        )}
        accessibilityRole="button"
        accessibilityState={{ disabled: isBlocked, busy: loading }}
        disabled={isBlocked}
        onPress={onPress}
        onPressIn={() => {
          setPressed(true);
          animateScale(0.97);
        }}
        onPressOut={() => {
          setPressed(false);
          animateScale(1);
        }}
      >
        {loading ? (
          <Text
            className={cn(textClassNames[variant], textClassName)}
            style={textStyle}
          >
            Loading...
          </Text>
        ) : (
          <View className="flex-row items-center justify-center gap-2">
            {leftIcon}
            {label !== null ? (
              <Text
                className={cn(
                  textClassNames[variant],
                  isIconButton && 'text-h3',
                  textClassName
                )}
                style={textStyle}
              >
                {label}
              </Text>
            ) : (
              children
            )}
            {rightIcon}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default Button;
