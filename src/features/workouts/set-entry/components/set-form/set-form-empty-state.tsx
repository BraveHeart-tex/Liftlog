import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { PlusIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface SetFormEmptyStateProps {
  onAddSet: () => void;
}

export function SetFormEmptyState({ onAddSet }: SetFormEmptyStateProps) {
  return (
    <View className="border-border bg-card min-h-48 items-center justify-center rounded-lg border border-dashed px-6 py-10">
      <Text variant="h3" className="text-center">
        No sets yet
      </Text>
      <Text variant="small" tone="muted" className="mt-2 text-center">
        Add your first set to start tracking this exercise.
      </Text>
      <Button
        className="mt-6 border-solid"
        leftIcon={<Icon as={PlusIcon} tone="primaryForeground" size="sm" />}
        onPress={onAddSet}
      >
        Add Set
      </Button>
    </View>
  );
}
