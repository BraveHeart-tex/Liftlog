import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db/schema';
import { useSettings } from '@/src/features/settings/hooks';
import { cn } from '@/src/lib/utils/cn';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import ReanimatedSwipeable, {
  type SwipeableMethods
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

type SetEntryRowProps = {
  set: Set;
  setNumber: number;
  isPR: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDeleteSet: () => void;
};

export function SetEntryRow({
  set,
  setNumber,
  isPR,
  isEditing,
  onEdit,
  onDeleteSet
}: SetEntryRowProps) {
  const { weightUnit } = useSettings();
  const [isDeleteActionHidden, setIsDeleteActionHidden] = useState(false);

  const handleDeleteSet = () => {
    Alert.alert(
      'Delete set?',
      'This set will be removed from the workout.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsDeleteActionHidden(false)
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setIsDeleteActionHidden(false);
            onDeleteSet();
          }
        }
      ],
      {
        onDismiss: () => setIsDeleteActionHidden(false)
      }
    );
  };

  const renderDeleteAction = (
    _progress: unknown,
    _translation: unknown,
    swipeable: SwipeableMethods
  ) => (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'bg-danger w-24 items-center justify-center px-3',
        isDeleteActionHidden && 'opacity-0'
      )}
      onPressIn={() => setIsDeleteActionHidden(true)}
      onPress={() => {
        swipeable.close();
        handleDeleteSet();
      }}
    >
      <Text variant="bodyMedium" className="text-primary-foreground">
        Delete
      </Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      overshootRight={false}
      onSwipeableClose={() => setIsDeleteActionHidden(false)}
      renderRightActions={renderDeleteAction}
    >
      <Pressable onPress={onEdit}>
        <View
          className={cn(
            'border-border bg-background flex-row items-center gap-3 border-b px-3 py-3',
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
              {formatWeightForUnit(set.weightKg, weightUnit)} {weightUnit}
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

          {isPR ? (
            <View className="bg-success/15 rounded-md px-2 py-1">
              <Text variant="caption" className="text-success">
                PR
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}
