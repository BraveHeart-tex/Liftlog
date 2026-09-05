import { LiftlogUpdater } from '@/modules/liftlog-updater/src';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { Text } from '@/src/components/ui/text';
import {
  cancelUpdate,
  checkForUpdate,
  downloadAndInstallUpdate
} from '@/src/features/app-updates/app-update.service';
import { useAppUpdateStore } from '@/src/features/app-updates/app-update.store';
import { cn } from '@/src/lib/utils/cn.utils';
import { useDrizzle } from '@/src/providers/database-provider';
import Constants from 'expo-constants';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  XCircle
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

type PillTone = 'success' | 'primary' | 'warning' | 'danger' | 'muted';

const PILL_STYLES: Record<
  PillTone,
  {
    bg: string;
    textTone: 'success' | 'primary' | 'warning' | 'danger' | 'muted';
    iconTone: 'success' | 'primary' | 'warning' | 'danger' | 'mutedForeground';
  }
> = {
  success: {
    bg: 'bg-success/15',
    textTone: 'success',
    iconTone: 'success'
  },
  primary: {
    bg: 'bg-primary-subtle',
    textTone: 'primary',
    iconTone: 'primary'
  },
  warning: {
    bg: 'bg-warning/15',
    textTone: 'warning',
    iconTone: 'warning'
  },
  danger: {
    bg: 'bg-danger/15',
    textTone: 'danger',
    iconTone: 'danger'
  },
  muted: {
    bg: 'bg-muted',
    textTone: 'muted',
    iconTone: 'mutedForeground'
  }
};

function StatusPill({
  tone,
  label,
  icon: PillIcon
}: {
  tone: PillTone;
  label: string;

  icon: typeof CheckCircle2;
}) {
  const styles = PILL_STYLES[tone];

  return (
    <View
      className={cn(
        'flex-row items-center gap-2 rounded-full px-3 py-1.5',
        styles.bg
      )}
    >
      <Icon as={PillIcon} size="sm" tone={styles.iconTone} />

      <Text variant="small" tone={styles.textTone}>
        {label}
      </Text>
    </View>
  );
}

function formatLastChecked(date: Date) {
  const diffMs = Date.now() - date.getTime();

  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) {
    return 'just now';
  }

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const diffHours = Math.round(diffMins / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const isToday = new Date().toDateString() === date.toDateString();

  return isToday ? 'to{day' : date.toLocaleDateString();
}

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
  const lastCheckedAt = (snapshot as { lastCheckedAt?: Date }).lastCheckedAt;

  // Determine status pill
  let pill: { tone: PillTone; label: string; icon: typeof CheckCircle2 };

  if (snapshot.state === 'failed') {
    pill = { tone: 'danger', label: 'Update failed', icon: XCircle };
  } else if (snapshot.state === 'permission_required') {
    pill = { tone: 'warning', label: 'Action needed', icon: AlertTriangle };
  } else if (isBusy) {
    pill = {
      tone: 'muted',
      label:
        progress !== null
          ? `Downloading ${progress}%`
          : snapshot.state === 'checking'
            ? 'Checking…'
            : 'Working…',
      icon: Loader2
    };
  } else if (availableUpdate) {
    pill = { tone: 'primary', label: 'Update available', icon: CheckCircle2 };
  } else {
    pill = { tone: 'success', label: 'Up to date', icon: CheckCircle2 };
  }

  return (
    <View className="mt-6">
      <Text variant="overline" tone="muted" className="mb-2">
        Updates
      </Text>
      <Card>
        <CardContent className="gap-0 p-0">
          {/* Status block */}
          <View className="gap-1.5 p-4">
            <View className="flex-row items-center justify-between">
              <Text variant="bodyMedium">App updates</Text>
              <StatusPill
                tone={pill.tone}
                label={pill.label}
                icon={pill.icon}
              />
            </View>
            <Text variant="small" tone="muted">
              Version {installedVersion}
              {availableUpdate
                ? ` • ${availableUpdate.manifest.versionName} available`
                : ' • Up to date'}
            </Text>
            {lastCheckedAt ? (
              <Text variant="small" tone="muted" className="opacity-70">
                Last checked {formatLastChecked(lastCheckedAt)}
              </Text>
            ) : null}
          </View>

          <View className="bg-border h-px" />

          {/* Action block */}
          <View className="p-2">
            {snapshot.state === 'permission_required' ? (
              <View className="gap-2 p-2">
                <Text variant="small" tone="warning">
                  Allow app installs in Android settings, then retry.
                </Text>
                <Button
                  variant="secondary"
                  onPress={() =>
                    LiftlogUpdater?.openInstallPermissionSettings()
                  }
                >
                  Open install settings
                </Button>
              </View>
            ) : isBusy ? (
              <View className="p-2">
                <Button variant="secondary" onPress={() => void cancelUpdate()}>
                  Cancel
                </Button>
              </View>
            ) : availableUpdate ? (
              <View className="p-2">
                <Button
                  onPress={() =>
                    void downloadAndInstallUpdate(
                      drizzle,
                      availableUpdate
                    ).catch(() => undefined)
                  }
                >
                  Update now
                </Button>
              </View>
            ) : snapshot.state === 'failed' ? (
              <View className="p-2">
                <Button variant="secondary" onPress={check}>
                  Retry
                </Button>
              </View>
            ) : (
              <Pressable
                onPress={check}
                className="active:bg-secondary flex-row items-center justify-between rounded-md p-2"
              >
                <Text variant="bodyMedium">Check for updates</Text>
                <Icon as={ChevronRight} size="md" tone="mutedForeground" />
              </Pressable>
            )}
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
