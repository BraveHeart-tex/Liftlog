import { useAppTheme, useTabBarTheme } from '@/src/theme/app-theme-provider';
import { appFonts } from '@/src/theme/fonts';
import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index'
};

export default function WorkoutLayout() {
  const { colors } = useAppTheme();
  const tabBarTheme = useTabBarTheme();
  const nativeHeaderOptions = {
    headerShown: true,
    headerShadowVisible: true,
    headerStyle: {
      backgroundColor: colors.card
    },
    headerTintColor: colors.foreground,
    headerTitleStyle: {
      color: colors.foreground,
      fontFamily: appFonts.faces.semiBold,
      fontSize: 17
    }
  };

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
      <Stack.Screen
        name="active/index"
        singular
        options={{ ...nativeHeaderOptions, title: 'Active workout' }}
      />
      <Stack.Screen
        name="active/edit-exercises"
        singular
        options={{ ...nativeHeaderOptions, title: 'Edit exercises' }}
      />
      <Stack.Screen
        name="exercise/[workoutExerciseId]/index"
        singular
        options={{ ...nativeHeaderOptions, title: 'Exercise' }}
      />
      <Stack.Screen
        name="exercise/[workoutExerciseId]/history"
        singular
        options={{ ...nativeHeaderOptions, title: 'Exercise history' }}
      />
    </Stack>
  );
}
