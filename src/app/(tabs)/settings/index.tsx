import { Card, CardContent } from '@/src/components/ui/card';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { View } from 'react-native';

export default function SettingsScreen() {
  return (
    <Screen scroll>
      <View>
        <Text variant="h1">Settings</Text>
        <Text variant="small" tone="muted" className="mt-2">
          App preferences and configuration
        </Text>
      </View>

      <Card className="mt-6">
        <CardContent>
          <Text variant="body">Settings coming soon.</Text>
        </CardContent>
      </Card>
    </Screen>
  );
}
