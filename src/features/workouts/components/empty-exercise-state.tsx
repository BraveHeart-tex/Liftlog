import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { View } from 'react-native';

interface EmptyExerciseStateProps {
  onAddExercise: () => void;
}

export function EmptyExerciseState({ onAddExercise }: EmptyExerciseStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text variant="h3" className="text-center">
        No exercises yet
      </Text>
      <Text variant="small" tone="muted" className="mt-2 text-center">
        Add your first exercise to get started.
      </Text>
      <Button className="mt-6 self-center" onPress={onAddExercise}>
        Add exercise
      </Button>
    </View>
  );
}
