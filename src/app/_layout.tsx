import '@/global.css';
import { CommonProviders } from '@/src/components/common-providers';
import { ScreenErrorBoundary } from '@/src/components/screen-error-boundary';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <CommonProviders>
      <ScreenErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workouts/[id]" />
        </Stack>
      </ScreenErrorBoundary>
    </CommonProviders>
  );
}
