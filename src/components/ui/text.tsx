import { cn } from '@/src/lib/utils/cn';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef
} from 'react';
import { Text as NativeText } from 'react-native';

type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyMedium'
  | 'small'
  | 'caption';

type TextTone = 'default' | 'muted' | 'success' | 'warning' | 'danger';

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
  danger: 'text-danger'
};

type NativeTextProps = Omit<
  ComponentPropsWithoutRef<typeof NativeText>,
  'className' | 'style'
>;

type TextProps = NativeTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
};

export const Text = forwardRef<ComponentRef<typeof NativeText>, TextProps>(
  function Text(
    { variant = 'body', tone = 'default', className, ...props },
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
        {...props}
      />
    );
  }
);
