import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn.utils';
import {
  Children,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode
} from 'react';
import { AccessibilityInfo, View } from 'react-native';

type FieldViewProps = ComponentPropsWithoutRef<typeof View> & {
  className?: string;
};

export function Field({ className, ...props }: FieldViewProps) {
  return <View {...props} className={cn('w-full', className)} />;
}

type FieldTextProps = {
  children: ReactNode;
  className?: string;
};

export function FieldLabel({ children, className }: FieldTextProps) {
  return (
    <Text variant="caption" className={cn('mb-2', className)}>
      {children}
    </Text>
  );
}

export function FieldDescription({ children, className }: FieldTextProps) {
  return (
    <Text variant="caption" tone="muted" className={cn('mt-2', className)}>
      {children}
    </Text>
  );
}

export function FieldError({ children, className }: FieldTextProps) {
  const previousMessage = useRef<string | undefined>(undefined);
  const message = Children.toArray(children)
    .filter(child => typeof child === 'string' || typeof child === 'number')
    .join('');

  useEffect(() => {
    if (message && message !== previousMessage.current) {
      AccessibilityInfo.announceForAccessibility(message);
    }

    previousMessage.current = message;
  }, [message]);

  return (
    <Text variant="caption" tone="danger" className={cn('mt-2', className)}>
      {children}
    </Text>
  );
}
