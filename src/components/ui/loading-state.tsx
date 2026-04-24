import { Text } from '@/src/components/ui/text';
import { StyledActivityIndicator } from '@/src/components/styled/activity-indicator';
import { cn } from '@/src/lib/utils/cn';
import { View } from 'react-native';

interface LoadingStateProps {
  label?: string;
  className?: string;
  size?: 'small' | 'large';
}

export function LoadingState({
  label = 'Loading...',
  className,
  size = 'large'
}: LoadingStateProps) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      className={cn('flex-1 items-center justify-center px-6 py-10', className)}
    >
      <StyledActivityIndicator className="text-primary" size={size} />
      {label ? (
        <Text variant="small" tone="muted" className="mt-3 text-center">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
