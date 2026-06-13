import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { ClipboardListIcon, PlusIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface NewTemplateEmptyStateProps {
  onAddExercise: () => void;
}

export function NewTemplateEmptyState({
  onAddExercise
}: NewTemplateEmptyStateProps) {
  return (
    <View className="items-center py-8">
      <View className="bg-card h-12 w-12 items-center justify-center rounded-lg">
        <Icon icon={ClipboardListIcon} tone="mutedForeground" size="md" />
      </View>

      <Text variant="bodyMedium" className="mt-3 text-center">
        No exercises added
      </Text>
      <Text variant="small" tone="muted" className="mt-1 text-center">
        Add exercises from your library to build this template.
      </Text>

      <Button
        variant="secondary"
        size="sm"
        className="mt-3"
        textClassName="text-primary text-sm"
        leftIcon={<Icon icon={PlusIcon} size="sm" tone="primary" />}
        onPress={onAddExercise}
      >
        Add exercise
      </Button>
    </View>
  );
}
