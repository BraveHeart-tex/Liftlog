import { StyledTextInput } from '@/src/components/styled/text-input';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';
import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode
} from 'react';
import { View, type TextInput } from 'react-native';

type NativeTextInputProps = ComponentPropsWithoutRef<typeof TextInput>;

type InputProps = NativeTextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftIconContainerClassName?: string;
  rightIconContainerClassName?: string;
  withContainerDefaults?: boolean;
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
    leftIconContainerClassName,
    rightIconContainerClassName,
    withContainerDefaults = true,
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
        <Text variant="small" className={labelClassName}>
          {label}
        </Text>
      ) : null}

      <View
        className={cn(
          withContainerDefaults &&
            'border-border bg-input mt-2 flex-row items-center rounded-lg border px-4 py-3',
          focused && !hasError && 'border-ring',
          hasError && 'border-danger',
          disabled && 'opacity-50',
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
});
