import { Screen } from "@/src/components/ui/screen";
import { Text, View } from "react-native";

export default function WorkoutScreen() {
  return (
    <Screen scroll>
      <View className="rounded-lg border border-border bg-card p-4">
        <Text className="text-h2 text-foreground">Workout</Text>
        <Text className="mt-2 text-body text-muted-foreground">
          Active workout logging and your next training session will live here.
        </Text>
      </View>
    </Screen>
  );
}
