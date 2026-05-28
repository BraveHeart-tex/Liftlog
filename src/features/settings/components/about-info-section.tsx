import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import Constants from 'expo-constants';
import { View } from 'react-native';

export const AboutInfoSection = () => {
  return (
    <View className="mt-6">
      <Text variant="overline" tone="muted" className="mb-2">
        About
      </Text>
      <Card>
        <CardContent>
          <View className="flex-row items-center justify-between py-1">
            <Text variant="bodyMedium">Version</Text>
            <Text variant="body" tone="muted">
              {Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );
};
