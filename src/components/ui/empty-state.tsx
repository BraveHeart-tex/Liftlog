import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { StyledScrollView } from '@/src/components/styled/scroll-view';

import { cn } from '@/src/lib/utils/cn';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from 'react-native';

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
      {icon ? (
        <Icon icon={icon} className="text-muted-foreground" size={48} />
      ) : null}
      <Text
        className={cn('text-h3 text-foreground text-center', icon && 'mt-4')}
      >
        {title}
      </Text>
      {description ? (
        <Text className="text-small text-muted-foreground mt-2 text-center">
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
