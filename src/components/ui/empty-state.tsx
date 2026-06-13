import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { StyledScrollView } from '@/src/components/styled/scroll-view';

import { cn } from '@/src/lib/utils/cn';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <StyledScrollView
      className="flex-1"
      contentContainerClassName={cn(
        'flex-grow items-center justify-center px-8',
        className
      )}
    >
      {icon ? <Icon icon={icon} tone="mutedForeground" size="empty" /> : null}
      <Text variant="h3" className={cn('text-center', icon && 'mt-4')}>
        {title}
      </Text>
      {description ? (
        <Text variant="small" tone="muted" className="mt-2 text-center">
          {description}
        </Text>
      ) : null}
      {action ? (
        <Button className="mt-6" onPress={action.onPress}>
          {action.label}
        </Button>
      ) : null}
    </StyledScrollView>
  );
}
