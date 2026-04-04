import { Pressable, Text, View } from "react-native";
import { Screen } from "../../components/ui/screen";

export default function SettingsScreen() {
  return (
    <Screen scroll>
      <Text className="text-h2 text-foreground">Settings</Text>

      <View className="mt-4 rounded-lg border border-border bg-card p-4">
        <Text className="text-caption text-muted-foreground">
          Workout defaults
        </Text>
        <Text className="mt-1 text-h3 text-foreground">kg • 4 working sets</Text>
        <Text className="mt-2 text-small text-muted-foreground">
          Keep logging fast by preloading your preferred units and set count.
        </Text>
      </View>

      <View className="mt-6">
        <Text className="text-caption text-muted-foreground">Preferences</Text>

        <Pressable className="mt-3 rounded-lg border border-border bg-card p-4">
          <Text className="text-h3 text-foreground">Rest Timer</Text>
          <Text className="mt-1 text-small text-muted-foreground">
            Default: 2 min between heavy sets
          </Text>
          <Text className="mt-2 text-caption text-muted-foreground">
            Tap to adjust your default timer
          </Text>
        </Pressable>

        <Pressable className="mt-3 rounded-lg border border-border bg-card p-4">
          <Text className="text-h3 text-foreground">Recovery Alerts</Text>
          <Text className="mt-1 text-small text-muted-foreground">
            Remind me when I miss two planned sessions
          </Text>
          <Text className="mt-2 text-caption text-progress-up">
            Alerts enabled
          </Text>
        </Pressable>

        <Pressable className="mt-3 rounded-lg border border-border bg-card p-4">
          <Text className="text-h3 text-foreground">Data Export</Text>
          <Text className="mt-1 text-small text-muted-foreground">
            Export workout history as CSV for backup or analysis
          </Text>
          <Text className="mt-2 text-caption text-muted-foreground">
            Last export: Mar 28
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
