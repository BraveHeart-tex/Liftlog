import { cn } from '@/src/lib/utils/cn.utils';
import { appFonts } from '@/src/theme/fonts';
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
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
      semiBold: 'font-semibold',
      bold: 'font-bold'
    },
    tone: {
      default: 'text-foreground',
      primary: 'text-primary',
      secondaryForeground: 'text-secondary-foreground',
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

const textVariants = (variants: TextVariants = {}) =>
  cn(textVariantConfig(variants));

type TextVariant = NonNullable<TextVariants['variant']>;

type TextWeight = keyof typeof appFonts.faces;

type TextTone = NonNullable<TextVariants['tone']>;

const variantFontWeights: Record<TextVariant, TextWeight> = {
  h1: 'bold',
  h2: 'semiBold',
  h3: 'medium',
  body: 'regular',
  bodyMedium: 'medium',
  small: 'regular',
  caption: 'medium',
  overline: 'medium'
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
  weight?: TextWeight;
  tone?: TextTone;
  className?: string;
};

export const Text = forwardRef<ComponentRef<typeof NativeText>, TextProps>(
  function Text(
    {
      variant = 'body',
      weight,
      tone = 'default',
      className,
      style,
      accessibilityRole,
      ...props
    },
    ref
  ) {
    const resolvedWeight = weight ?? variantFontWeights[variant];

    return (
      <NativeText
        ref={ref}
        className={cn(textVariants({ variant, tone, weight }), className)}
        style={[
          nativeTextDefaults,
          { fontFamily: appFonts.faces[resolvedWeight] },
          style
        ]}
        {...props}
        accessibilityRole={
          accessibilityRole ??
          (variant === 'h1' || variant === 'h2' || variant === 'h3'
            ? 'header'
            : undefined)
        }
      />
    );
  }
);
