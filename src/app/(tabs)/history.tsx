import { Screen } from '@/src/components/ui/screen';
import { Text, View } from 'react-native';

export default function HistoryScreen() {
  return (
    <Screen scroll>
      <View className="border-border bg-card rounded-lg border p-4">
        <Text className="text-h2 text-foreground">History</Text>
        <Text className="text-body text-muted-foreground mt-2">
          Logged workouts, previous sessions, and progress review will live
          here.
        </Text>
      </View>
    </Screen>
  );
}
