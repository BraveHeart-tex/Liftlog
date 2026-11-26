import { cn } from '@/src/lib/utils/cn.utils';
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
  'accessibilityState' | 'disabled' | 'editable' | 'invalid'
>;

type InputBehavior = {
  editable: boolean;
  accessibilityState: AccessibilityState & { invalid?: boolean };
};

export function useInputBehavior({
  accessibilityState,
  disabled = false,
  editable,
  invalid = false
}: InputBehaviorProps): InputBehavior {
  const inputState = accessibilityState as
    | (AccessibilityState & { invalid?: boolean })
    | undefined;

  return {
    editable: editable ?? !disabled,
    accessibilityState: {
      ...inputState,
      disabled: disabled || inputState?.disabled,
      invalid: invalid || inputState?.invalid
    }
  };
}

export function getInputClassName({
  className,
  disabled,
  invalid,
  multiline
}: {
  className?: string;
  disabled: boolean;
  invalid: boolean;
  multiline?: boolean;
}) {
  return cn(
    'text-body text-foreground w-full rounded-md border border-border bg-input px-3 py-1 h-12',
    multiline && 'h-20',
    invalid ? 'border-danger focus:border-danger' : 'focus:border-ring',
    disabled && 'text-muted-foreground opacity-60',
    className
  );
}
