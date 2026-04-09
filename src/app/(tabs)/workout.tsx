import { Screen } from '@/src/components/ui/screen';
import { Text, View } from 'react-native';

export default function WorkoutScreen() {
  return (
    <Screen scroll>
      <View className="border-border bg-card rounded-lg border p-4">
        <Text className="text-h2 text-foreground">Workout</Text>
        <Text className="text-body text-muted-foreground mt-2">
          Active workout logging and your next training session will live here.
        </Text>
      </View>
    </Screen>
  );
}
