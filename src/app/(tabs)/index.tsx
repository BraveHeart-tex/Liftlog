import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="px-4 py-6">
        <Text className="text-h2 text-foreground">Workout</Text>

        <View className="mt-4 rounded-lg border border-border bg-card p-4">
          <Text className="text-caption text-muted-foreground">
            Volume trend
          </Text>
          <Text className="mt-1 text-h3 text-progress-up">+7.5% this week</Text>
          <Text className="mt-2 text-small text-muted-foreground">
            Progressive overload is on track.
          </Text>
        </View>

        <View className="mt-6">
          <Text className="text-caption text-muted-foreground">Exercises</Text>

          <Pressable className="mt-3 rounded-lg border border-border bg-card p-4">
            <Text className="text-h3 text-foreground">Bench Press</Text>
            <Text className="mt-1 text-small text-muted-foreground">
              Last: 60 × 8, 8, 7
            </Text>
            <Text className="mt-2 text-caption text-progress-up">+2 reps</Text>
          </Pressable>

          <Pressable className="mt-3 rounded-lg border border-border bg-card p-4">
            <Text className="text-h3 text-foreground">Squat</Text>
            <Text className="mt-1 text-small text-muted-foreground">
              Last: 100 × 5, 5, 5
            </Text>
            <Text className="mt-2 text-caption text-muted-foreground">
              Matched
            </Text>
          </Pressable>
        </View>

        <Pressable className="mt-6 items-center rounded-lg bg-primary px-4 py-4">
          <Text className="text-body-medium text-primary-foreground">
            + Add Exercise
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
