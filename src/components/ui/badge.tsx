import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const baseClassName =
  'self-start flex-row items-center gap-1 rounded-md px-2 py-0.5';

const variantClassNames: Record<BadgeVariant, string> = {
  default: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  outline: 'border border-border'
};

const textVariantClassNames: Record<BadgeVariant, string> = {
  default: 'text-secondary-foreground',
  success: 'text-accent-foreground',
  warning: 'text-accent-foreground',
  danger: 'text-primary-foreground',
  info: 'text-primary-foreground',
  outline: 'text-foreground'
};

export function Badge({
  variant = 'default',
  children,
  className
}: BadgeProps) {
  return (
    <View className={cn(baseClassName, variantClassNames[variant], className)}>
      {typeof children === 'string' ? (
        <Text
          variant="caption"
          className={cn('font-medium', textVariantClassNames[variant])}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
