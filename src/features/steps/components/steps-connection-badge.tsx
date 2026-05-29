import { Badge } from '@/src/components/ui/badge';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';
import { View } from 'react-native';

interface StepsConnectionBadgeProps {
  availabilityLabel?: string;
  isConnected: boolean;
}

export function StepsConnectionBadge({
  availabilityLabel,
  isConnected
}: StepsConnectionBadgeProps) {
  return (
    <Badge
      className={cn(
        'flex flex-row items-center',
        isConnected
          ? 'bg-success/10 dark:bg-success/20'
          : 'bg-secondary dark:bg-secondary/20'
      )}
    >
      <View
        className={cn(
          'h-2 w-2 rounded-full',
          isConnected
            ? 'dark:bg-success bg-success/50'
            : 'bg-secondary-foreground/50 dark:bg-secondary'
        )}
      />
      <Text
        variant="caption"
        className={isConnected ? 'text-success' : 'text-secondary-foreground'}
      >
        {isConnected
          ? 'Health Connect synced'
          : (availabilityLabel ?? 'Not Connected')}
      </Text>
    </Badge>
  );
}
