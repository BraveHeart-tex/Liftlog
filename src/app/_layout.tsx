import '@/global.css';
import { CommonProviders } from '@/src/components/common-providers';
import { DrizzleStudio } from '@/src/components/drizzle-studio';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { bootstrapThemeColorScheme } from '@/src/theme/bootstrap-theme';
import { appFontAssets } from '@/src/theme/fonts';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';

bootstrapThemeColorScheme();
void preventAutoHideAsync();

function RootNavigator() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background
        }
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="settings"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="exercises/[id]"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="exercises/new"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="workouts/[id]"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="workouts/backfill/[id]"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="workouts/backfill/exercise/[workoutExerciseId]"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="workouts/edit/[id]"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="workouts/edit/exercise/[workoutExerciseId]"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="workouts/templates/[id]"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="workouts/templates/new"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontLoadError] = useFonts(appFontAssets);
  const [databaseStatus, setDatabaseStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading');

  const handleDatabaseReady = useCallback(() => {
    setDatabaseStatus(currentStatus =>
      currentStatus === 'loading' ? 'ready' : currentStatus
    );
  }, []);

  const handleDatabaseError = useCallback(() => {
    setDatabaseStatus('error');
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontLoadError) && databaseStatus !== 'loading') {
      void hideAsync();
    }
  }, [databaseStatus, fontLoadError, fontsLoaded]);

  if (!fontsLoaded && !fontLoadError) {
    return null;
  }

  return (
    <CommonProviders
      onDatabaseError={handleDatabaseError}
      onDatabaseReady={handleDatabaseReady}
    >
      <DrizzleStudio />
      <RootNavigator />
    </CommonProviders>
  );
}
