import { Screen } from "@/src/components/ui/screen";
import { Text, View } from "react-native";

export default function ProgramsScreen() {
  return (
    <Screen scroll>
      <View className="rounded-lg border border-border bg-card p-4">
        <Text className="text-h2 text-foreground">Programs</Text>
        <Text className="mt-2 text-body text-muted-foreground">
          Program templates, weekly structure, and progression rules will live
          here.
        </Text>
      </View>
    </Screen>
  );
}
