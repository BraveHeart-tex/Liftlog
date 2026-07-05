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
      <Stack.Screen name="active" singular />
      <Stack.Screen name="exercise/[workoutExerciseId]/index" singular />
      <Stack.Screen name="exercise/[workoutExerciseId]/history" singular />
    </Stack>
  );
}
