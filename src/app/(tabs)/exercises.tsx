import { Screen } from "@/src/components/ui/screen";
import { Text, View } from "react-native";

export default function ExercisesScreen() {
  return (
    <Screen scroll>
      <View className="rounded-lg border border-border bg-card p-4">
        <Text className="text-h2 text-foreground">Exercises</Text>
        <Text className="mt-2 text-body text-muted-foreground">
          Your exercise library, recent performance, and quick selection flow
          will live here.
        </Text>
      </View>
    </Screen>
  );
}
