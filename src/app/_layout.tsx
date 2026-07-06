import '@/global.css';
import { CommonProviders } from '@/src/components/common-providers';
import { DrizzleStudio } from '@/src/components/drizzle-studio';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { bootstrapThemeColorScheme } from '@/src/theme/bootstrap-theme';
import { appFontAssets } from '@/src/theme/fonts';
import {
  init as initSentry,
  mobileReplayIntegration,
  wrap as wrapWithSentry
} from '@sentry/react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';

initSentry({
  dsn: 'https://1bdaf14c00267e50ae9ecee83e794a69@o4507100890726400.ingest.de.sentry.io/4511688205467728',

  sendDefaultPii: false,

  // Enable Logs
  enableLogs: false,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  spotlight: __DEV__
});

bootstrapThemeColorScheme();
void preventAutoHideAsync();

function RootNavigator() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: true,
        headerStyle: {
          backgroundColor: colors.card
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          color: colors.foreground
        },
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
        singular
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          title: 'Settings'
        }}
      />
      <Stack.Screen
        name="exercises/[id]"
        singular
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          title: 'Exercise'
        }}
      />
      <Stack.Screen
        name="exercises/new"
        singular
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: true,
          title: 'Create exercise'
        }}
      />
      <Stack.Screen
        name="workouts/[id]"
        singular
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          title: 'Workout'
        }}
      />
      <Stack.Screen
        name="workouts/backfill/[id]"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="workouts/backfill/exercise/[workoutExerciseId]"
        singular
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="workouts/edit/[id]"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          title: 'Edit workout'
        }}
      />
      <Stack.Screen
        name="workouts/edit/exercise/[workoutExerciseId]"
        singular
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          title: 'Exercise'
        }}
      />
      <Stack.Screen
        name="workouts/templates/[id]"
        singular
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          title: 'Template'
        }}
      />
      <Stack.Screen
        name="workouts/templates/new"
        singular
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: true,
          title: 'Create template'
        }}
      />
    </Stack>
  );
}

function RootLayout() {
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

export default wrapWithSentry(RootLayout);
