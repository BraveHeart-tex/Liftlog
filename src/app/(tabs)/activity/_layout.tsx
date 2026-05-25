import { useTabBarTheme } from '@/src/theme/app-theme-provider';
import { Redirect, Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function ActivityLayout() {
  const tabBarTheme = useTabBarTheme();

  if (Platform.OS !== 'android') {
    return <Redirect href="/(tabs)/workout" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: tabBarTheme.sceneBackgroundColor
        }
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
