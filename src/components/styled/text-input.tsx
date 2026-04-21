import { styled } from 'nativewind';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import {
  StyleSheet,
  TextInput,
  type ColorValue,
  type StyleProp,
  type TextStyle
} from 'react-native';

type TextInputColorBridgeProps = ComponentPropsWithoutRef<typeof TextInput> & {
  placeholderStyle?: StyleProp<TextStyle>;
  selectionStyle?: StyleProp<TextStyle>;
};

export function getStyleColor(
  style: StyleProp<TextStyle>
): ColorValue | undefined {
  const color = StyleSheet.flatten(style)?.color;

  return typeof color === 'string' ? color : undefined;
}

const TextInputColorBridge = forwardRef<TextInput, TextInputColorBridgeProps>(
  function TextInputColorBridge(
    {
      placeholderStyle,
      selectionStyle,
      placeholderTextColor,
      selectionColor,
      ...props
    },
    ref
  ) {
    return (
      <TextInput
        ref={ref}
        placeholderTextColor={
          placeholderTextColor ?? getStyleColor(placeholderStyle)
        }
        selectionColor={selectionColor ?? getStyleColor(selectionStyle)}
        {...props}
      />
    );
  }
);

export const StyledTextInput = styled(TextInputColorBridge, {
  className: {
    target: 'style',
    nativeStyleMapping: {
      textAlign: true
    }
  },
  placeholderClassName: 'placeholderStyle',
  selectionClassName: 'selectionStyle'
});
