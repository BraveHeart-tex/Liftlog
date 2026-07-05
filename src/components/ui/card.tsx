import { cn } from '@/src/lib/utils/cn.utils';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type CardProps<TChildren = ReactNode> = {
  children: TChildren;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <View className={cn('border-border bg-card rounded-md border', className)}>
      {children}
    </View>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <View className={cn('p-4', className)}>{children}</View>;
}
