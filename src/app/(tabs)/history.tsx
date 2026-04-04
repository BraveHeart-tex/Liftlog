import { Pressable, Text, View } from "react-native";
import { Screen } from "../../components/ui/screen";

export default function HistoryScreen() {
  return (
    <Screen scroll>
      <Text className="text-h2 text-foreground">History</Text>

      <View className="mt-4 rounded-lg border border-border bg-card p-4">
        <Text className="text-caption text-muted-foreground">This week</Text>
        <Text className="mt-1 text-h3 text-progress-up">+312 kg volume</Text>
        <Text className="mt-2 text-small text-muted-foreground">
          4 workouts logged with stronger top sets across your main lifts.
        </Text>
      </View>

      <View className="mt-6">
        <Text className="text-caption text-muted-foreground">
          Recent sessions
        </Text>

        <Pressable className="mt-3 rounded-lg border border-border bg-card p-4">
          <Text className="text-h3 text-foreground">Push Day</Text>
          <Text className="mt-1 text-small text-muted-foreground">
            Apr 3 • Bench Press, Incline DB Press, Dips
          </Text>
          <Text className="mt-2 text-small text-muted-foreground">
            Last: 60 × 8, 8, 7
          </Text>
          <Text className="mt-2 text-caption text-progress-up">
            +2 reps vs last session
          </Text>
        </Pressable>

        <Pressable className="mt-3 rounded-lg border border-border bg-card p-4">
          <Text className="text-h3 text-foreground">Leg Day</Text>
          <Text className="mt-1 text-small text-muted-foreground">
            Apr 1 • Squat, Romanian Deadlift, Leg Press
          </Text>
          <Text className="mt-2 text-small text-muted-foreground">
            Last: 100 × 5, 5, 5
          </Text>
          <Text className="mt-2 text-caption text-muted-foreground">
            Matched last squat performance
          </Text>
        </Pressable>

        <Pressable className="mt-3 rounded-lg border border-border bg-card p-4">
          <Text className="text-h3 text-foreground">Pull Day</Text>
          <Text className="mt-1 text-small text-muted-foreground">
            Mar 30 • Barbell Row, Pull-Up, Hammer Curl
          </Text>
          <Text className="mt-2 text-small text-muted-foreground">
            Last: 70 × 10, 9, 8
          </Text>
          <Text className="mt-2 text-caption text-progress-up">
            +2.5 kg on barbell row
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
