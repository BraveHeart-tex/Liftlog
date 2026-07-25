import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { Stack } from 'expo-router';
import { CheckIcon, XIcon } from 'lucide-react-native';
import { Fragment } from 'react';
import { View } from 'react-native';

interface ActiveWorkoutEditHeaderProps {
  workoutName: string;
  onCancel: () => void;
  onSave: () => void;
}

export function ActiveWorkoutEditHeader({
  workoutName,
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
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Icon as={XIcon} tone="foreground" size="sm" />}
              onPress={onCancel}
            >
              Cancel
            </Button>
          ),
          headerRight: () => (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Icon as={CheckIcon} tone="foreground" size="sm" />}
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
