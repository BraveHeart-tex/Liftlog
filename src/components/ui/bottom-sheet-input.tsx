import { StyledBottomSheetTextInput } from '@/src/components/styled/bottom-sheet';
import { InputFieldLayout } from '@/src/components/ui/input-field-layout';
import { cn } from '@/src/lib/utils/cn.utils';
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode
} from 'react';
import {
  AccessibilityInfo,
  type AccessibilityState,
  type TextInput
} from 'react-native';

type NativeTextInputProps = ComponentPropsWithoutRef<typeof TextInput>;
type InputAccessibilityState = AccessibilityState & { invalid?: boolean };

type BottomSheetTextInputRef = ComponentRef<typeof StyledBottomSheetTextInput>;

type BottomSheetInputProps = NativeTextInputProps & {
  density?: 'default' | 'compact';
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

export const BottomSheetInput = forwardRef<
  BottomSheetTextInputRef,
  BottomSheetInputProps
>(function BottomSheetInput(
  {
    label,
    density = 'default',
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
    accessibilityLabel,
    accessibilityHint,
    accessibilityState,
    onBlur,
    onFocus,
    ...props
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);
  const isEditable = editable ?? !disabled;
  const previousError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (error && error !== previousError.current) {
      AccessibilityInfo.announceForAccessibility(error);
    }

    previousError.current = error;
  }, [error]);

  const supportingText = [accessibilityHint, error, hint]
    .filter(Boolean)
    .join('. ');
  const inputState = accessibilityState as InputAccessibilityState | undefined;
  const inputAccessibilityState: InputAccessibilityState = {
    ...inputState,
    disabled: disabled || inputState?.disabled,
    invalid: hasError || inputState?.invalid
  };

  return (
    <InputFieldLayout
      density={density}
      label={label}
      hint={hint}
      error={error}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      leftIconContainerClassName={leftIconContainerClassName}
      rightIconContainerClassName={rightIconContainerClassName}
      withContainerDefaults={withContainerDefaults}
      className={className}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      hintClassName={hintClassName}
      errorClassName={errorClassName}
      disabled={disabled}
      focused={focused}
    >
      <StyledBottomSheetTextInput
        {...props}
        ref={ref}
        className={cn(
          'text-body text-foreground flex-1',
          props.multiline && 'min-h-20',
          disabled && 'text-muted-foreground',
          inputClassName
        )}
        textAlignVertical={props.multiline ? 'top' : 'center'}
        editable={isEditable}
        accessibilityLabel={label ?? accessibilityLabel}
        accessibilityHint={supportingText || undefined}
        accessibilityState={inputAccessibilityState}
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
      />
    </InputFieldLayout>
  );
});
