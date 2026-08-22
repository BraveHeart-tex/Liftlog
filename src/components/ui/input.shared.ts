import { cn } from '@/src/lib/utils/cn.utils';
import { useState } from 'react';
import type { AccessibilityState, TextInputProps } from 'react-native';

export type InputProps = TextInputProps & {
  className?: string;
  placeholderClassName?: string;
  selectionClassName?: string;
  disabled?: boolean;
  invalid?: boolean;
};

type InputBehaviorProps = Pick<
  InputProps,
  | 'accessibilityState'
  | 'disabled'
  | 'editable'
  | 'invalid'
  | 'onBlur'
  | 'onFocus'
>;

type InputBehavior = {
  focused: boolean;
  editable: boolean;
  accessibilityState: AccessibilityState & { invalid?: boolean };
  onBlur: NonNullable<TextInputProps['onBlur']>;
  onFocus: NonNullable<TextInputProps['onFocus']>;
};

export function useInputBehavior({
  accessibilityState,
  disabled = false,
  editable,
  invalid = false,
  onBlur,
  onFocus
}: InputBehaviorProps): InputBehavior {
  const [focused, setFocused] = useState(false);
  const inputState = accessibilityState as
    | (AccessibilityState & { invalid?: boolean })
    | undefined;

  return {
    focused,
    editable: editable ?? !disabled,
    accessibilityState: {
      ...inputState,
      disabled: disabled || inputState?.disabled,
      invalid: invalid || inputState?.invalid
    },
    onBlur: event => {
      setFocused(false);
      onBlur?.(event);
    },
    onFocus: event => {
      setFocused(true);
      onFocus?.(event);
    }
  };
}

export function getInputClassName({
  className,
  disabled,
  focused,
  invalid,
  multiline
}: {
  className?: string;
  disabled: boolean;
  focused: boolean;
  invalid: boolean;
  multiline?: boolean;
}) {
  return cn(
    'text-body text-foreground w-full rounded-md border border-border bg-input px-4 py-0 h-12',
    multiline && 'h-20',
    focused && !invalid && 'border-ring',
    invalid && 'border-danger',
    disabled && 'text-muted-foreground opacity-60',
    className
  );
}
