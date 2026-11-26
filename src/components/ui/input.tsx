import {
  getInputClassName,
  useInputBehavior,
  type InputProps
} from '@/src/components/ui/input.shared';
import { StyledTextInput } from '@/src/components/styled/text-input';
import { appFonts } from '@/src/theme/fonts';
import { forwardRef, type ComponentRef } from 'react';

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
    invalid
  });

  return (
    <StyledTextInput
      {...props}
      ref={ref}
      className={getInputClassName({
        className,
        disabled,
        invalid,
        multiline
      })}
      style={[
        { fontFamily: appFonts.faces.regular },
        props.style,
        { includeFontPadding: false }
      ]}
      textAlignVertical={multiline ? 'top' : 'center'}
      editable={behavior.editable}
      accessibilityState={behavior.accessibilityState}
      placeholderClassName={placeholderClassName}
      selectionClassName={selectionClassName}
    />
  );
});
