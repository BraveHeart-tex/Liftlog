import { useAppTheme, useTabBarTheme } from '@/src/theme/app-theme-provider';
import { appFonts } from '@/src/theme/fonts';
import { Stack } from 'expo-router';

export default function LogLayout() {
  const { colors } = useAppTheme();
  const tabBarTheme = useTabBarTheme();
  const nativeHeaderOptions = {
    headerShown: true,
    headerShadowVisible: false,
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
        name="steps"
        options={{ ...nativeHeaderOptions, title: 'Steps' }}
      />
    </Stack>
  );
}
