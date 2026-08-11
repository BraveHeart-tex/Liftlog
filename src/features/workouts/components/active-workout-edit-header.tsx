import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { Stack } from 'expo-router';
import { XIcon } from 'lucide-react-native';
import { Fragment } from 'react';
import { View } from 'react-native';

interface ActiveWorkoutEditHeaderProps {
  workoutName: string;
  canSave?: boolean;
  isSaving?: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function ActiveWorkoutEditHeader({
  workoutName,
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
              <Icon as={XIcon} tone="foreground" size="lg" />
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
      <View className="px-4 pt-4 pb-3">
        <Text variant="h2">{workoutName}</Text>
      </View>
    </Fragment>
  );
}
