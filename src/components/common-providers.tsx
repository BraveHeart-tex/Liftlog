import { DatabaseProvider } from '@/src/components/database-provider';
import { AppThemeProvider } from '@/src/theme/app-theme-provider';
import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  initialWindowMetrics,
  SafeAreaProvider
} from 'react-native-safe-area-context';

export function CommonProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider
        initialMetrics={initialWindowMetrics}
        style={{ flex: 1 }}
      >
        <DatabaseProvider>
          <AppThemeProvider>{children}</AppThemeProvider>
        </DatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
