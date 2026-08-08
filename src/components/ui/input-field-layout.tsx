import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn.utils';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type InputFieldLayoutProps = {
  density: 'default' | 'compact';
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftIconContainerClassName?: string;
  rightIconContainerClassName?: string;
  withContainerDefaults: boolean;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  hintClassName?: string;
  errorClassName?: string;
  disabled: boolean;
  focused: boolean;
  children: ReactNode;
};

export function InputFieldLayout({
  density,
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  leftIconContainerClassName,
  rightIconContainerClassName,
  withContainerDefaults,
  className,
  containerClassName,
  labelClassName,
  hintClassName,
  errorClassName,
  disabled,
  focused,
  children
}: InputFieldLayoutProps) {
  const hasError = Boolean(error);
  const containerDensityClassName =
    density === 'compact' ? 'min-h-11 px-3 py-2' : 'min-h-12 px-4 py-3';

  return (
    <View className={cn('w-full', className)}>
      {label ? (
        <Text variant="overline" className={labelClassName}>
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          withContainerDefaults &&
            cn(
              'border-border bg-input mt-2 flex-row items-center rounded-md border',
              containerDensityClassName
            ),
          focused && !hasError && 'border-ring',
          hasError && 'border-danger',
          disabled && 'opacity-60',
          containerClassName
        )}
      >
        {leftIcon ? (
          <View
            className={cn(
              'mr-3 items-center justify-center',
              leftIconContainerClassName
            )}
          >
            {leftIcon}
          </View>
        ) : null}
        {children}
        {rightIcon ? (
          <View
            className={cn(
              'ml-3 items-center justify-center',
              rightIconContainerClassName
            )}
          >
            {rightIcon}
          </View>
        ) : null}
      </View>
      {error ? (
        <Text
          variant="caption"
          tone="danger"
          className={cn('mt-2', errorClassName)}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          variant="caption"
          tone="muted"
          className={cn('mt-2', hintClassName)}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
