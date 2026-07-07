import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn.utils';
import { iconSizes } from '@/src/theme/sizes';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface SupersetIndicatorProps {
  className?: string;
}

export function SupersetIndicator({ className }: SupersetIndicatorProps) {
  return (
    <View className={cn('flex-row items-center gap-2 px-4 py-1', className)}>
      <View className="bg-primary/40 h-px flex-1" />
      <View className="items-center">
        <Icon
          as={ChevronUpIcon}
          size={iconSizes.xs}
          tone="primary"
          strokeWidth={2.5}
        />
        <View className="border-primary/30 bg-primary/10 rounded-full border px-2 py-0.5">
          <Text variant="caption" tone="primary">
            Superset
          </Text>
        </View>
        <Icon
          as={ChevronDownIcon}
          size={iconSizes.xs}
          tone="primary"
          strokeWidth={2.5}
        />
      </View>
      <View className="bg-primary/40 h-px flex-1" />
    </View>
  );
}
