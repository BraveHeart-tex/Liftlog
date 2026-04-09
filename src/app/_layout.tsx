import '@/global.css';
import { CommonProviders } from '@/src/components/common-providers';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <CommonProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </CommonProviders>
  );
}
