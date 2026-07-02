import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { RenameSheet } from '@/src/components/ui/rename-sheet';
import { Text } from '@/src/components/ui/text';
import { ExerciseDetailActionsSheet } from '@/src/features/exercises/components/exercise-detail-actions-sheet';
import { EllipsisVerticalIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

interface ExerciseDetailHeaderProps {
  name: string;
  categoryLabel: string;
  isCustomExercise: boolean;
  removeActionLabel: 'Archive' | 'Delete';
  onRename: (name: string) => string | undefined;
  onEditDetails: () => void;
  onRemove: () => void;
}

export function ExerciseDetailHeader({
  name,
  categoryLabel,
  isCustomExercise,
  removeActionLabel,
  onRename,
  onEditDetails,
  onRemove
}: ExerciseDetailHeaderProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);
  const openActions = useCallback(() => setIsActionsOpen(true), []);
  const closeActions = useCallback(() => setIsActionsOpen(false), []);
  const openRenameSheet = useCallback(() => setIsRenameSheetOpen(true), []);
  const closeRenameSheet = useCallback(() => setIsRenameSheetOpen(false), []);

  return (
    <>
      <View className="flex-row items-center gap-3">
        <BackButton />
        <View className="flex-1">
          <Text variant="h1" numberOfLines={2} ellipsizeMode="tail">
            {name}
          </Text>
          <Text variant="small" tone="muted">
            {categoryLabel}
          </Text>
        </View>

        {isCustomExercise ? (
          <Button
            variant="ghost"
            size="icon"
            accessibilityLabel="Exercise actions"
            onPress={openActions}
          >
            <Icon as={EllipsisVerticalIcon} size="lg" tone="foreground" />
          </Button>
        ) : null}
      </View>

      <ExerciseDetailActionsSheet
        isOpen={isActionsOpen}
        removeActionLabel={removeActionLabel}
        onClose={closeActions}
        onRename={openRenameSheet}
        onEditDetails={onEditDetails}
        onRemove={onRemove}
      />

      <RenameSheet
        isOpen={isRenameSheetOpen}
        title="Rename exercise"
        description="Update the custom exercise name shown in workouts and history."
        inputLabel="Exercise name"
        initialName={name}
        requiredMessage="Exercise name is required."
        fallbackErrorMessage="Could not rename exercise. Try again."
        onClose={closeRenameSheet}
        onSubmit={onRename}
      />
    </>
  );
}
