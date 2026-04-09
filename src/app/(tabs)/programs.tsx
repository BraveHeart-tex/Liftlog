import { Screen } from '@/src/components/ui/screen';
import { Text, View } from 'react-native';

export default function ProgramsScreen() {
  return (
    <Screen scroll>
      <View className="border-border bg-card rounded-lg border p-4">
        <Text className="text-h2 text-foreground">Programs</Text>
        <Text className="text-body text-muted-foreground mt-2">
          Program templates, weekly structure, and progression rules will live
          here.
        </Text>
      </View>
    </Screen>
  );
}
