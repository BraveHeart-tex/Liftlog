import { useTabBarTheme } from '@/src/theme/app-theme-provider';
import { Stack } from 'expo-router';

export default function HistoryLayout() {
  const tabBarTheme = useTabBarTheme();

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
