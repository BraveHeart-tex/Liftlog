import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn.utils';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { View } from 'react-native';

type EmptyStateProps = Omit<
  ComponentPropsWithoutRef<typeof View>,
  'children'
> & {
  children: ReactNode;
};

type EmptyStateTextProps = ComponentPropsWithoutRef<typeof Text> & {
  children: ReactNode;
};

type EmptyStateIconProps = ComponentPropsWithoutRef<typeof Icon> & {
  containerClassName?: string;
};

type EmptyStateActionProps = Omit<
  ComponentPropsWithoutRef<typeof View>,
  'children'
> & {
  children: ReactNode;
};

function EmptyStateRoot({ children, className, ...props }: EmptyStateProps) {
  return (
    <View
      {...props}
      className={cn('items-center justify-center gap-2', className)}
    >
      {children}
    </View>
  );
}

function EmptyStateIcon({
  className,
  containerClassName,
  size = 'xl',
  tone = 'foreground',
  ...props
}: EmptyStateIconProps) {
  return (
    <View
      className={cn(
        'border-input bg-card items-center justify-center rounded-2xl border p-4',
        containerClassName
      )}
    >
      <Icon {...props} className={className} size={size} tone={tone} />
    </View>
  );
}

function EmptyStateTitle({
  children,
  className,
  variant = 'h3',
  ...props
}: EmptyStateTextProps) {
  return (
    <Text {...props} variant={variant} className={cn('text-center', className)}>
      {children}
    </Text>
  );
}

function EmptyStateDescription({
  children,
  className,
  tone = 'muted',
  variant = 'small',
  ...props
}: EmptyStateTextProps) {
  return (
    <Text
      {...props}
      variant={variant}
      tone={tone}
      className={cn('text-center', className)}
    >
      {children}
    </Text>
  );
}

function EmptyStateAction({
  children,
  className,
  ...props
}: EmptyStateActionProps) {
  return (
    <View {...props} className={cn('mt-2', className)}>
      {children}
    </View>
  );
}

export const EmptyState = Object.assign(EmptyStateRoot, {
  Icon: EmptyStateIcon,
  Title: EmptyStateTitle,
  Description: EmptyStateDescription,
  Action: EmptyStateAction
});
