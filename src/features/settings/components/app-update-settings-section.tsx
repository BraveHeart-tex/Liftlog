import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { Text } from '@/src/components/ui/text';
import {
  checkForUpdate,
  cancelUpdate,
  downloadAndInstallUpdate
} from '@/src/features/app-updates/app-update.service';
import { useAppUpdateStore } from '@/src/features/app-updates/app-update.store';
import { useDrizzle } from '@/src/providers/database-provider';
import { LiftlogUpdater } from '@/modules/liftlog-updater/src';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

export function AppUpdateSettingsSection() {
  const drizzle = useDrizzle();
  const snapshot = useAppUpdateStore();
  const [installedVersion, setInstalledVersion] = useState<string>(
    Constants.expoConfig?.version ?? '1.0.0'
  );

  useEffect(() => {
    if (LiftlogUpdater) {
      void LiftlogUpdater.getInstalledBuildInfoAsync().then(info =>
        setInstalledVersion(info.versionName)
      );
    }
  }, []);

  const check = useCallback(async () => {
    try {
      const update = await checkForUpdate(drizzle, { manual: true });

      if (!update) {
        showSnackbar({
          message: 'You are using the latest version.',
          variant: 'success'
        });
      }
    } catch {
      showSnackbar({
        message: 'Could not check for updates. Try again.',
        variant: 'danger'
      });
    }
  }, [drizzle]);

  if (Platform.OS !== 'android') {
    return null;
  }

  const isBusy = [
    'checking',
    'downloading',
    'verifying',
    'installing'
  ].includes(snapshot.state);
  const progress = snapshot.totalBytes
    ? Math.round((snapshot.bytesDownloaded / snapshot.totalBytes) * 100)
    : null;
  const availableUpdate = snapshot.availableUpdate;

  return (
    <View className="mt-6">
      <Text variant="overline" tone="muted" className="mb-2">
        Updates
      </Text>
      <Card>
        <CardContent className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="bodyMedium">Installed version</Text>
            <Text variant="body" tone="muted">
              {installedVersion}
            </Text>
          </View>
          {availableUpdate ? (
            <Text variant="small" tone="primary">
              Version {availableUpdate.manifest.versionName} is available.
            </Text>
          ) : null}
          {progress !== null ? (
            <Text variant="small" tone="muted">
              Downloading: {progress}%
            </Text>
          ) : null}
          {snapshot.state === 'permission_required' ? (
            <>
              <Text variant="small" tone="warning">
                Allow app installs in Android settings, then retry.
              </Text>
              <Button
                variant="secondary"
                onPress={() => LiftlogUpdater?.openInstallPermissionSettings()}
              >
                Open install settings
              </Button>
            </>
          ) : null}
          {isBusy ? (
            <Button variant="secondary" onPress={() => void cancelUpdate()}>
              Cancel
            </Button>
          ) : availableUpdate ? (
            <Button
              onPress={() =>
                void downloadAndInstallUpdate(drizzle, availableUpdate).catch(
                  () => undefined
                )
              }
            >
              Update now
            </Button>
          ) : (
            <Button
              variant="secondary"
              loading={snapshot.state === 'checking'}
              onPress={check}
            >
              Check for updates
            </Button>
          )}
          {snapshot.state === 'failed' ? (
            <Button variant="secondary" onPress={check}>
              Retry
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </View>
  );
}
