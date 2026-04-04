import { Pressable, Text, View } from "react-native";
import { Screen } from "../../components/ui/screen";

export default function ProfileScreen() {
  return (
    <Screen scroll>
      <Text className="text-h2 text-foreground">Profile</Text>

      <View className="mt-4 rounded-lg border border-border bg-card p-4">
        <Text className="text-caption text-muted-foreground">Athlete</Text>
        <Text className="mt-1 text-h3 text-foreground">Bora Kaya</Text>
        <Text className="mt-2 text-small text-muted-foreground">
          Focused on clean progressive overload with four sessions each week.
        </Text>
        <Text className="mt-3 text-caption text-progress-up">
          6 sessions completed in the last 10 days
        </Text>
      </View>

      <View className="mt-6">
        <Text className="text-caption text-muted-foreground">Key lifts</Text>

        <View className="mt-3 rounded-lg border border-border bg-card p-4">
          <Text className="text-h3 text-foreground">Bench Press</Text>
          <Text className="mt-1 text-small text-muted-foreground">
            Last workout: 60 × 8, 8, 7
          </Text>
          <Text className="mt-2 text-caption text-progress-up">+2 reps</Text>
        </View>

        <View className="mt-3 rounded-lg border border-border bg-card p-4">
          <Text className="text-h3 text-foreground">Squat</Text>
          <Text className="mt-1 text-small text-muted-foreground">
            Last workout: 100 × 5, 5, 5
          </Text>
          <Text className="mt-2 text-caption text-muted-foreground">
            Stable this week
          </Text>
        </View>
      </View>

      <Pressable className="mt-6 rounded-lg border border-border bg-card p-4">
        <Text className="text-h3 text-foreground">Training goal</Text>
        <Text className="mt-1 text-small text-muted-foreground">
          Add 5 kg to bench and 10 kg to squat over the next 8 weeks.
        </Text>
        <Text className="mt-2 text-caption text-progress-up">
          Progress is ahead of target
        </Text>
      </Pressable>
    </Screen>
  );
}
