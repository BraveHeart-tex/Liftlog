import { cn } from '@/src/lib/utils/cn';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef
} from 'react';
import { Text as NativeText, type TextStyle } from 'react-native';

type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyMedium'
  | 'small'
  | 'caption';

type TextTone =
  | 'default'
  | 'muted'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inherit';

const variantClassNames: Record<TextVariant, string> = {
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  body: 'text-body',
  bodyMedium: 'text-body-medium',
  small: 'text-small',
  caption: 'text-caption'
};

const toneClassNames: Record<TextTone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  inherit: ''
};

const variantFontFamilies: Record<TextVariant, string> = {
  h1: 'Inter_700Bold',
  h2: 'Inter_700Bold',
  h3: 'Inter_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  small: 'Inter_400Regular',
  caption: 'Inter_500Medium'
};

const nativeTextDefaults: TextStyle = {
  includeFontPadding: false,
  textAlignVertical: 'center'
};

type NativeTextProps = Omit<
  ComponentPropsWithoutRef<typeof NativeText>,
  'className'
>;

type TextProps = NativeTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
};

export const Text = forwardRef<ComponentRef<typeof NativeText>, TextProps>(
  function Text(
    { variant = 'body', tone = 'default', className, style, ...props },
    ref
  ) {
    return (
      <NativeText
        ref={ref}
        className={cn(
          variantClassNames[variant],
          toneClassNames[tone],
          className
        )}
        style={[
          nativeTextDefaults,
          { fontFamily: variantFontFamilies[variant] },
          style
        ]}
        {...props}
      />
    );
  }
);
