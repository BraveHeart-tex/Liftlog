import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn.utils';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  layout?: 'page' | 'section';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  layout = 'page',
  className
}: EmptyStateProps) {
  const isSection = layout === 'section';

  return (
    <View
      className={cn(
        'items-center justify-center',
        isSection ? 'py-4' : 'flex-1 px-8',
        className
      )}
    >
      {icon ? (
        isSection ? (
          <View className="border-border bg-muted h-12 w-12 items-center justify-center rounded-md border">
            <Icon as={icon} tone="mutedForeground" size="md" />
          </View>
        ) : (
          <Icon as={icon} tone="mutedForeground" size="empty" />
        )
      ) : null}
      <Text
        variant={isSection ? 'bodyMedium' : 'h3'}
        className={cn('text-center', icon && (isSection ? 'mt-3' : 'mt-4'))}
      >
        {title}
      </Text>
      {description ? (
        <Text
          variant="small"
          tone="muted"
          className={cn(isSection ? 'mt-1' : 'mt-2', 'text-center')}
        >
          {description}
        </Text>
      ) : null}
      {action ? (
        <View className={isSection ? 'mt-3' : 'mt-6'}>{action}</View>
      ) : null}
    </View>
  );
}
