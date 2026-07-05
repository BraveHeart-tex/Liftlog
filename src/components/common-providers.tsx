import { DatabaseProvider } from '@/src/components/database-provider';
import { ScreenErrorBoundary } from '@/src/components/screen-error-boundary';
import { SnackbarHost } from '@/src/components/ui/snackbar';
import { StepsSyncHost } from '@/src/features/steps/components/steps-sync-host';
import { RestTimerHost } from '@/src/features/workouts/components/rest-timer-host';
import { AppThemeProvider } from '@/src/theme/app-theme-provider';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  initialWindowMetrics,
  SafeAreaProvider
} from 'react-native-safe-area-context';

interface CommonProvidersProps extends PropsWithChildren {
  onDatabaseError?: () => void;
  onDatabaseReady: () => void;
}

export function CommonProviders({
  children,
  onDatabaseError,
  onDatabaseReady
}: CommonProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider
        initialMetrics={initialWindowMetrics}
        style={{ flex: 1 }}
      >
        <AppThemeProvider>
          <DatabaseProvider onError={onDatabaseError} onReady={onDatabaseReady}>
            <ScreenErrorBoundary>
              <BottomSheetModalProvider>
                {children}
                <StepsSyncHost />
                <RestTimerHost />
                <SnackbarHost />
              </BottomSheetModalProvider>
            </ScreenErrorBoundary>
          </DatabaseProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
