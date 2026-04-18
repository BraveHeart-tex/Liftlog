import { useTabBarTheme } from '@/src/theme/app-theme-provider';
import { Stack } from 'expo-router';

export default function WorkoutLayout() {
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
      <Stack.Screen name="active" />
      <Stack.Screen name="exercise/[workoutExerciseId]" />
    </Stack>
  );
}
