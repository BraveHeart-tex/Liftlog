import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db/schema';
import { cn } from '@/src/lib/utils/cn';
import { Alert, Pressable, View } from 'react-native';
import { formatInputNumber } from './utils';

type SetEntryRowProps = {
  set: Set;
  setNumber: number;
  isEditing: boolean;
  onEdit: () => void;
  onDeleteSet: () => void;
};

export function SetEntryRow({
  set,
  setNumber,
  isEditing,
  onEdit,
  onDeleteSet
}: SetEntryRowProps) {
  const handleDeleteSet = () => {
    Alert.alert('Delete set?', 'This set will be removed from the workout.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: onDeleteSet
      }
    ]);
  };

  return (
    <Pressable onPress={onEdit} onLongPress={handleDeleteSet}>
      <View
        className={cn(
          'border-border flex-row items-center gap-3 border-b px-3 py-3',
          isEditing && 'bg-muted/50'
        )}
      >
        <View className="bg-muted h-12 w-12 items-center justify-center rounded-md">
          <Text variant="caption" tone="muted">
            Set
          </Text>
          <Text variant="bodyMedium">{setNumber}</Text>
        </View>

        <View className="flex-1">
          <Text variant="caption" tone="muted">
            Weight
          </Text>
          <Text variant="bodyMedium" className="mt-1">
            {formatInputNumber(set.weightKg)} kg
          </Text>
        </View>

        <View className="flex-1">
          <Text variant="caption" tone="muted">
            Reps
          </Text>
          <Text variant="bodyMedium" className="mt-1">
            {set.reps}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
