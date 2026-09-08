import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { useAppUpdates } from '@/src/features/app-updates/update-provider';
import {
  presentUpdateAttempt,
  presentUpdateState
} from '@/src/features/app-updates/update-presenter';
import { cn } from '@/src/lib/utils/cn.utils';
import { iconSizes } from '@/src/theme/sizes';
import { RefreshCw } from 'lucide-react-native';
import { Platform, View } from 'react-native';

function formatLastChecked(timestamp: number) {
  const checkedAt = new Date(timestamp);
  const today = new Date();
  const isToday =
    checkedAt.getFullYear() === today.getFullYear() &&
    checkedAt.getMonth() === today.getMonth() &&
    checkedAt.getDate() === today.getDate();
  const time = checkedAt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return isToday
    ? `Today, ${time}`
    : checkedAt.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
}

function MetadataRow({
  label,
  value,
  bordered = true
}: {
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <View
      className={cn(
        'border-border flex-row justify-between gap-4 py-3',
        bordered && 'border-t'
      )}
    >
      <Text variant="bodyMedium">{label}</Text>
      <Text variant="small" tone="muted" className="shrink text-right">
        {value}
      </Text>
    </View>
  );
}

export function AppUpdateSection() {
  const {
    state,
    attempt,
    checkForUpdates,
    dismissUpdate,
    startUpdate,
    resumeUpdate,
    cancelUpdate
  } = useAppUpdates();
  const presentation = presentUpdateState(state);
  const attemptPresentation = presentUpdateAttempt(attempt);
  const attemptActive = [
    'permission',
    'downloading',
    'verifying',
    'staging'
  ].includes(attempt.status);

  if (Platform.OS !== 'android') {
    return null;
  }

  return (
    <View className="mt-6">
      <Text variant="overline" tone="muted" className="mb-2">
        Updates
      </Text>
      <Card className="overflow-hidden rounded-lg">
        <CardContent className="px-5 py-4">
          {presentation.availableVersion ? (
            <View className="pb-3">
              <Text variant="bodyMedium" weight="semiBold">
                Update available
              </Text>
              <Text variant="small" tone="muted" className="mt-1">
                Version {presentation.availableVersion} is ready to install.
              </Text>
            </View>
          ) : null}
          <MetadataRow
            label="Installed"
            value={presentation.installedVersion}
            bordered={Boolean(presentation.availableVersion)}
          />
          {presentation.availableVersion ? (
            <MetadataRow
              label="Available"
              value={presentation.availableVersion}
            />
          ) : null}
          {presentation.size ? (
            <MetadataRow label="Size" value={presentation.size} />
          ) : null}
          {state.lastSuccessfulCheckAt ? (
            <MetadataRow
              label="Last checked"
              value={formatLastChecked(state.lastSuccessfulCheckAt)}
            />
          ) : null}
          {presentation.releaseNotes ? (
            <View className="border-border border-t py-3">
              <Text variant="bodyMedium">Release notes</Text>
              <Text
                variant="caption"
                weight="regular"
                tone="muted"
                className="mt-1"
              >
                {presentation.releaseNotes}
              </Text>
            </View>
          ) : null}
          {presentation.message ? (
            <Text
              variant="caption"
              tone={state.status === 'error' ? 'danger' : 'muted'}
              className="pb-3"
              accessibilityRole="alert"
            >
              {presentation.message}
            </Text>
          ) : null}
          {attemptPresentation.message ? (
            <View
              className="border-border border-t py-3"
              accessibilityLiveRegion="polite"
            >
              <Text
                variant="small"
                weight="medium"
                tone={attempt.status === 'failed' ? 'danger' : 'default'}
              >
                {attemptPresentation.message}
              </Text>
              {attempt.status === 'downloading' ? (
                <View
                  className="bg-muted mt-3 h-2 overflow-hidden rounded-full"
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: 100,
                    now: Math.round((attempt.progress ?? 0) * 100)
                  }}
                >
                  <View
                    className="bg-primary h-full rounded-full"
                    style={{
                      width: `${Math.round((attempt.progress ?? 0) * 100)}%`
                    }}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
          {presentation.availableVersion && attempt.status === 'idle' ? (
            <View className="border-border flex-row gap-3 border-t py-3">
              <Button
                variant="secondary"
                containerClassName="flex-1"
                className="w-full"
                onPress={dismissUpdate}
              >
                Later
              </Button>
              <Button
                containerClassName="flex-1"
                className="w-full"
                onPress={startUpdate}
              >
                Update
              </Button>
            </View>
          ) : null}
          {attemptPresentation.action ? (
            <View className="border-border border-t py-3">
              <Button
                variant={
                  attemptPresentation.action === 'cancel'
                    ? 'secondary'
                    : 'primary'
                }
                fullWidth
                onPress={
                  attemptPresentation.action === 'cancel'
                    ? cancelUpdate
                    : resumeUpdate
                }
              >
                {attemptPresentation.action === 'cancel'
                  ? 'Cancel'
                  : attemptPresentation.action === 'permission'
                    ? 'Open permission settings'
                    : 'Retry'}
              </Button>
            </View>
          ) : null}
          <View className="border-border border-t pt-2">
            <Button
              variant="ghost"
              fullWidth
              loading={state.status === 'checking'}
              disabled={attemptActive}
              loadingLabel="Checking..."
              textClassName="text-primary text-small"
              spinnerClassName="text-primary"
              leftIcon={
                <Icon as={RefreshCw} size={iconSizes.sm} tone="primary" />
              }
              onPress={checkForUpdates}
            >
              Check again
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
