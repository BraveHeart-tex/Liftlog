import {
  getInputClassName,
  useInputBehavior,
  type InputProps
} from '@/src/components/ui/input.shared';
import { StyledBottomSheetTextInput } from '@/src/components/styled/bottom-sheet';
import { forwardRef, type ComponentRef } from 'react';
import type { TextInputProps } from 'react-native';

export type { InputProps } from '@/src/components/ui/input.shared';

export const BottomSheetInput = forwardRef<
  ComponentRef<typeof StyledBottomSheetTextInput>,
  InputProps
>(function BottomSheetInput(
  {
    className,
    disabled = false,
    editable,
    invalid = false,
    multiline,
    accessibilityState,
    onBlur,
    onFocus,
    placeholderClassName = 'text-muted-foreground',
    selectionClassName = 'text-primary',
    ...props
  },
  ref
) {
  const behavior = useInputBehavior({
    accessibilityState,
    disabled,
    editable,
    invalid,
    onBlur,
    onFocus
  });

  return (
    <StyledBottomSheetTextInput
      {...(props as TextInputProps)}
      ref={ref}
      className={getInputClassName({
        className,
        disabled,
        focused: behavior.focused,
        invalid,
        multiline
      })}
      textAlignVertical={multiline ? 'top' : 'center'}
      editable={behavior.editable}
      accessibilityState={behavior.accessibilityState}
      onBlur={behavior.onBlur}
      onFocus={behavior.onFocus}
      placeholderClassName={placeholderClassName}
      selectionClassName={selectionClassName}
    />
  );
});
