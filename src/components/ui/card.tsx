import { cn } from '@/src/lib/utils/cn.utils';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode
} from 'react';
import { View } from 'react-native';

type CardProps = ComponentPropsWithoutRef<typeof View> & {
  children: ReactNode;
};

export const Card = forwardRef<View, CardProps>(function Card(
  { children, className, ...props },
  ref
) {
  return (
    <View
      ref={ref}
      {...props}
      className={cn('border-border bg-card rounded-md border', className)}
    >
      {children}
    </View>
  );
});

export const CardContent = forwardRef<View, CardProps>(function CardContent(
  { children, className, ...props },
  ref
) {
  return (
    <View ref={ref} {...props} className={cn('p-4', className)}>
      {children}
    </View>
  );
});
