import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';

interface ActiveWorkoutEditHeaderProps {
  workoutName: string;
  onDone: () => void;
}

export function ActiveWorkoutEditHeader({
  workoutName,
  onDone
}: ActiveWorkoutEditHeaderProps) {
  return (
    <Fragment>
      <Stack.Screen
        options={{
          title: 'Edit exercises',
          headerRight: () => (
            <Button variant="ghost" size="sm" onPress={onDone}>
              Done
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
