import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db/schema';
import { formatWorkoutDate } from '@/src/lib/utils/date.utils';
import { Stack } from 'expo-router';
import { SaveIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface HistoricalWorkoutHeaderProps {
  title: string;
  workoutName: string;
  startedAt: Workout['startedAt'];
  canSave: boolean;
  onSave: () => void;
}

export function HistoricalWorkoutHeader({
  title,
  workoutName,
  startedAt,
  canSave,
  onSave
}: HistoricalWorkoutHeaderProps) {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          headerBackVisible: true,
          headerLeft: undefined,
          headerTitleAlign: undefined,
          headerRight: () => (
            <Button
              size="sm"
              disabled={!canSave}
              leftIcon={
                <Icon as={SaveIcon} tone="primaryForeground" size="sm" />
              }
              onPress={onSave}
            >
              Save
            </Button>
          )
        }}
      />

      <View className="px-4 pt-4 pb-2">
        <Text variant="h2">{workoutName}</Text>
        <Text variant="caption" tone="muted" className="mt-1">
          {formatWorkoutDate(startedAt, 'full')}
        </Text>
      </View>
    </>
  );
}
