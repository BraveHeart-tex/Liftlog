import { StyledTextInput } from '@/src/components/styled/text-input';
import { BackButton } from '@/src/components/ui/back-button';
import { Text } from '@/src/components/ui/text';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { forwardRef } from 'react';
import { Pressable, View, type TextInput } from 'react-native';

interface WorkoutDetailHeaderProps {
  name: string;
  startedAt: number;
  isRenaming: boolean;
  draftName: string;
  renameError?: string;
  onBeginRename: () => void;
  onCancelRename: () => void;
  onChangeDraftName: (name: string) => void;
  onSubmitRename: () => void;
}

export const WorkoutDetailHeader = forwardRef<
  TextInput,
  WorkoutDetailHeaderProps
>(function WorkoutDetailHeader(
  {
    name,
    startedAt,
    isRenaming,
    draftName,
    renameError,
    onBeginRename,
    onCancelRename,
    onChangeDraftName,
    onSubmitRename
  },
  renameInputRef
) {
  return (
    <View className="flex-row items-center gap-3">
      <BackButton onPress={isRenaming ? onCancelRename : undefined} />

      <View className="flex-1">
        {isRenaming ? (
          <StyledTextInput
            ref={renameInputRef}
            className="text-h1 text-foreground border-border rounded-md border-b py-1"
            selectionClassName="text-primary"
            value={draftName}
            onChangeText={onChangeDraftName}
            accessibilityLabel="Workout name"
            autoCapitalize="words"
            autoCorrect={false}
            blurOnSubmit={false}
            enterKeyHint="done"
            returnKeyType="done"
            maxLength={80}
            selectTextOnFocus
            submitBehavior="submit"
            onSubmitEditing={onSubmitRename}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rename workout"
            onPress={onBeginRename}
          >
            <Text variant="h1" numberOfLines={2}>
              {name}
            </Text>
          </Pressable>
        )}

        <Text variant="small" tone="muted" className="mt-1">
          {formatWorkoutDate(startedAt, 'full')}
        </Text>

        {renameError ? (
          <Text variant="caption" tone="danger" className="mt-2">
            {renameError}
          </Text>
        ) : null}
      </View>
    </View>
  );
});
