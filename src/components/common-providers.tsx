import { DatabaseProvider } from '@/src/components/database-provider';
import { AppThemeProvider } from '@/src/theme/app-theme-provider';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
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
          <AppThemeProvider>
            <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
          </AppThemeProvider>
        </DatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
