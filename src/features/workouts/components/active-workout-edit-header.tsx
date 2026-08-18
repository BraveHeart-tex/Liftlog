import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';

interface ActiveWorkoutEditHeaderProps {
  workoutName: string;
  exerciseCount?: number;
  changeCount?: number;
  canSave?: boolean;
  isSaving?: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function ActiveWorkoutEditHeader({
  workoutName,
  exerciseCount,
  changeCount,
  canSave = true,
  isSaving = false,
  onCancel,
  onSave
}: ActiveWorkoutEditHeaderProps) {
  return (
    <Fragment>
      <Stack.Screen
        options={{
          title: 'Edit exercises',
          headerBackVisible: false,
          headerTitleAlign: 'center',
          headerLeft: () => (
            <Button variant="ghost" size="sm" onPress={onCancel}>
              Cancel
            </Button>
          ),
          headerRight: () => (
            <Button
              size="sm"
              disabled={!canSave}
              loading={isSaving}
              onPress={onSave}
            >
              Save
            </Button>
          )
        }}
      />
      <View className="border-border border-b px-4 pt-3 pb-2">
        <Text variant="h3" weight="medium">
          {workoutName}
        </Text>
        <Text variant="caption" tone="muted" className="mt-1">
          {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'} -{' '}
          {changeCount}{' '}
          {changeCount === 1 ? 'unsaved change' : 'unsaved changes'}
        </Text>
      </View>
    </Fragment>
  );
}
