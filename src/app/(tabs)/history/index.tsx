import { Screen } from "@/src/components/ui/screen";
import { Text, View } from "react-native";

export default function HistoryScreen() {
  return (
    <Screen scroll>
      <View className="rounded-lg border border-border bg-card p-4">
        <Text className="text-h2 text-foreground">History</Text>
        <Text className="mt-2 text-body text-muted-foreground">
          Logged workouts, previous sessions, and progress review will live
          here.
        </Text>
      </View>
    </Screen>
  );
}
