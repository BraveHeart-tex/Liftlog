import { cn } from '@/src/lib/utils/cn';
import { appFonts, type AppFontFace } from '@/src/theme/fonts';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef
} from 'react';
import { Text as NativeText, type TextStyle } from 'react-native';

const textVariantConfig = cva('', {
  variants: {
    variant: {
      h1: 'text-h1',
      h2: 'text-h2',
      h3: 'text-h3',
      body: 'text-body',
      bodyMedium: 'text-body-medium',
      small: 'text-small',
      caption: 'text-caption',
      overline: 'text-caption uppercase tracking-wider'
    },
    tone: {
      default: 'text-foreground',
      primary: 'text-primary',
      muted: 'text-muted-foreground',
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-danger',
      inherit: ''
    }
  },
  defaultVariants: {
    variant: 'body',
    tone: 'default'
  }
});

type TextVariants = VariantProps<typeof textVariantConfig>;

export const textVariants = (variants: TextVariants = {}) =>
  cn(textVariantConfig(variants));

type TextVariant = NonNullable<TextVariants['variant']>;

type TextTone = NonNullable<TextVariants['tone']>;

const variantFontFamilies: Record<TextVariant, AppFontFace> = {
  h1: appFonts.faces.bold,
  h2: appFonts.faces.semiBold,
  h3: appFonts.faces.medium,
  body: appFonts.faces.regular,
  bodyMedium: appFonts.faces.medium,
  small: appFonts.faces.regular,
  caption: appFonts.faces.medium,
  overline: appFonts.faces.medium
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
        className={cn(textVariants({ variant, tone }), className)}
        style={[
          nativeTextDefaults,
          { fontFamily: variantFontFamilies[variant] },
          style
        ]}
        {...props}
        allowFontScaling={false}
      />
    );
  }
);
