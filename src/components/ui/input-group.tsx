import { cn } from '@/src/lib/utils/cn.utils';
import { useState, type ComponentPropsWithoutRef } from 'react';
import { View } from 'react-native';

type GroupViewProps = ComponentPropsWithoutRef<typeof View> & {
  className?: string;
};

export type InputGroupProps = GroupViewProps & {
  invalid?: boolean;
  disabled?: boolean;
};

export function InputGroup({
  className,
  disabled = false,
  invalid = false,
  onBlur,
  onFocus,
  ...props
}: InputGroupProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      {...props}
      className={cn(
        'border-border bg-input min-h-12 flex-row items-center rounded-md border px-4 py-3',
        focused && !invalid && 'border-ring',
        invalid && 'border-danger',
        disabled && 'opacity-60',
        className
      )}
      onBlur={event => {
        setFocused(false);
        onBlur?.(event);
      }}
      onFocus={event => {
        setFocused(true);
        onFocus?.(event);
      }}
    />
  );
}

export function InputSlot({ className, ...props }: GroupViewProps) {
  return (
    <View {...props} className={cn('items-center justify-center', className)} />
  );
}
