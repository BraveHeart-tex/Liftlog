import {
  getInputClassName,
  useInputBehavior,
  type InputProps
} from '@/src/components/ui/input.shared';
import { StyledTextInput } from '@/src/components/styled/text-input';
import { forwardRef, type ComponentRef } from 'react';

export type { InputProps } from '@/src/components/ui/input.shared';

export const Input = forwardRef<
  ComponentRef<typeof StyledTextInput>,
  InputProps
>(function Input(
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
    <StyledTextInput
      {...props}
      ref={ref}
      className={getInputClassName({
        className,
        disabled,
        focused: behavior.focused,
        invalid,
        multiline
      })}
      style={[props.style, { includeFontPadding: false }]}
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
