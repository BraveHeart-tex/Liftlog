import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn.utils';

const badgeVariantConfig = cva(
  'self-start flex-row items-center gap-1 rounded-md px-2 py-0.5',
  {
    variants: {
      variant: {
        default: 'bg-secondary',
        success: 'bg-success/10',
        warning: 'bg-warning/10',
        danger: 'bg-danger/10',
        info: 'bg-info/10',
        outline: 'border border-border'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

type BadgeVariants = VariantProps<typeof badgeVariantConfig>;

const badgeVariants = (variants: BadgeVariants = {}) =>
  cn(badgeVariantConfig(variants));

type BadgeVariant = NonNullable<BadgeVariants['variant']>;

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const badgeTextVariants = cva('font-medium', {
  variants: {
    variant: {
      default: 'text-secondary-foreground',
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-danger',
      info: 'text-info',
      outline: 'text-foreground'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

export function Badge({
  variant = 'default',
  children,
  className
}: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      {typeof children === 'string' ? (
        <Text variant="caption" className={cn(badgeTextVariants({ variant }))}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
