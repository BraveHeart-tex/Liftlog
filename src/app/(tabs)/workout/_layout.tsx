import { tabBarTheme } from '@/src/theme/tokens';
import { Stack } from 'expo-router';

export default function WorkoutLayout() {
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
