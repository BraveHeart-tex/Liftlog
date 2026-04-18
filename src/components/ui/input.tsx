import { StyledTextInput } from '@/src/components/styled/text-input';
import { cn } from '@/src/lib/utils/cn';
import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode
} from 'react';
import { Text, View, type TextInput } from 'react-native';

type NativeTextInputProps = ComponentPropsWithoutRef<typeof TextInput>;

export type InputProps = NativeTextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  hintClassName?: string;
  errorClassName?: string;
  disabled?: boolean;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    containerClassName,
    className,
    inputClassName,
    labelClassName,
    hintClassName,
    errorClassName,
    disabled = false,
    editable,
    onBlur,
    onFocus,
    ...props
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);
  const isEditable = editable ?? !disabled;

  return (
    <View className={cn('w-full', className)}>
      {label ? (
        <Text className={cn('text-small text-foreground', labelClassName)}>
          {label}
        </Text>
      ) : null}

      <View
        className={cn(
          'border-border bg-input mt-2 flex-row items-center rounded-lg border px-4 py-3',
          focused && !hasError && 'border-ring',
          hasError && 'border-danger',
          disabled && 'opacity-50',
          containerClassName
        )}
      >
        {leftIcon ? (
          <View className="mr-3 items-center justify-center">{leftIcon}</View>
        ) : null}

        <StyledTextInput
          ref={ref}
          className={cn('text-body text-foreground flex-1', inputClassName)}
          editable={isEditable}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderClassName="text-muted-foreground"
          selectionClassName="text-primary"
          {...props}
        />

        {rightIcon ? (
          <View className="ml-3 items-center justify-center">{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text className={cn('text-caption text-danger mt-2', errorClassName)}>
          {error}
        </Text>
      ) : hint ? (
        <Text
          className={cn(
            'text-caption text-muted-foreground mt-2',
            hintClassName
          )}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

export default Input;
