import { DatabaseProvider } from '@/src/components/database-provider';
import { ScreenErrorBoundary } from '@/src/components/screen-error-boundary';
import { AlertDialogHost } from '@/src/components/ui/alert-dialog';
import { SnackbarHost } from '@/src/components/ui/snackbar';
import { SettingsProvider } from '@/src/features/settings/settings-provider';
import { StepsSyncHost } from '@/src/features/steps/components/steps-sync-host';
import { RestTimerHost } from '@/src/features/workouts/components/rest-timer-host';
import { AppThemeProvider } from '@/src/theme/app-theme-provider';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { setAudioModeAsync } from 'expo-audio';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface CommonProvidersProps extends PropsWithChildren {
  onDatabaseError?: () => void;
  onDatabaseReady: () => void;
}

export function CommonProviders({
  children,
  onDatabaseError,
  onDatabaseReady
}: CommonProvidersProps) {
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers'
    }).catch(error => {
      console.error('Failed to configure app audio mode', error);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <DatabaseProvider onError={onDatabaseError} onReady={onDatabaseReady}>
          <ScreenErrorBoundary>
            <SettingsProvider>
              <BottomSheetModalProvider>
                {children}
                <StepsSyncHost />
                <RestTimerHost />
                <SnackbarHost />
                <AlertDialogHost />
              </BottomSheetModalProvider>
            </SettingsProvider>
          </ScreenErrorBoundary>
        </DatabaseProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
