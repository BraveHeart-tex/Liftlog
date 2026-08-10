import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { PlusIcon } from 'lucide-react-native';

interface SetFormEmptyStateProps {
  onAddSet: () => void;
}

export function SetFormEmptyState({ onAddSet }: SetFormEmptyStateProps) {
  return (
    <EmptyState
      kind="empty"
      layout="section"
      title="No sets yet"
      description="Add your first set to start tracking this exercise."
      className="border-border bg-card min-h-48 rounded-lg border border-dashed"
      actions={
        <Button
          className="border-solid"
          leftIcon={<Icon as={PlusIcon} tone="primaryForeground" size="sm" />}
          onPress={onAddSet}
        >
          Add Set
        </Button>
      }
    />
  );
}
