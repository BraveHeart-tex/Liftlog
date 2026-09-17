import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { useAppUpdates } from '@/src/features/app-updates/update-provider';
import {
  formatMegabytes,
  presentUpdateAttempt,
  presentUpdateState
} from '@/src/features/app-updates/update-presenter';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { cn } from '@/src/lib/utils/cn.utils';
import { iconSizes } from '@/src/theme/sizes';
import { RefreshCw } from 'lucide-react-native';
import { Platform, View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

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
        'flex-row justify-between gap-4 py-3',
        bordered && 'border-border border-t'
      )}
    >
      <Text variant="bodyMedium">{label}</Text>
      <Text variant="small" tone="muted" className="shrink text-right">
        {value}
      </Text>
    </View>
  );
}

function DownloadProgress({
  bytesDownloaded,
  totalBytes,
  progress
}: {
  bytesDownloaded?: number;
  totalBytes?: number;
  progress?: number;
}) {
  const reduceMotion = useReducedMotion();
  const progressValue = useSharedValue(0);
  const safeProgress = Math.min(1, Math.max(0, progress ?? 0));
  const downloaded = formatMegabytes(bytesDownloaded ?? 0);
  const total = formatMegabytes(totalBytes ?? 0);
  const numericWidth = Math.max(downloaded.length, total.length) * 8;

  useEffect(() => {
    progressValue.value = reduceMotion
      ? safeProgress
      : withTiming(safeProgress, {
          duration: MOTION_DURATION_MS.standard,
          easing: Easing.out(Easing.ease)
        });
  }, [progressValue, reduceMotion, safeProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`
  }));

  return (
    <View>
      <View className="flex-row items-center">
        <Text variant="small" weight="medium">
          Downloading update
        </Text>
        <Text
          variant="small"
          weight="medium"
          className="ml-auto"
          style={{
            fontVariant: ['tabular-nums'],
            minWidth: 32,
            textAlign: 'right'
          }}
        >
          {Math.round(safeProgress * 100)}%
        </Text>
      </View>
      <View className="mt-1 flex-row items-center">
        <View style={{ width: numericWidth }}>
          <Text
            variant="caption"
            tone="muted"
            style={{ fontVariant: ['tabular-nums'], textAlign: 'right' }}
          >
            {downloaded}
          </Text>
        </View>
        <Text
          variant="caption"
          tone="muted"
          className="ml-1"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          of {total}
        </Text>
      </View>
      <View
        className="bg-muted mt-3 h-2 overflow-hidden rounded-full"
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(safeProgress * 100)
        }}
      >
        <Animated.View
          className="bg-primary h-full rounded-full"
          style={fillStyle}
        />
      </View>
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
  const attemptPresentation = presentUpdateAttempt(attempt, state.release);
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
          {presentation.availableVersion ? (
            <Text
              variant="caption"
              tone="muted"
              className="border-border border-t py-3"
            >
              LiftLog closes while Android replaces the app. If it does not
              reopen, use the update-installed notification or open LiftLog from
              your launcher.
            </Text>
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
              {attempt.status === 'downloading' ? (
                <DownloadProgress
                  bytesDownloaded={attempt.bytesDownloaded}
                  totalBytes={attempt.totalBytes}
                  progress={attempt.progress}
                />
              ) : null}
              {attempt.status !== 'downloading' ? (
                <Text
                  variant="small"
                  weight="medium"
                  tone={attempt.status === 'failed' ? 'danger' : 'default'}
                >
                  {attemptPresentation.message}
                </Text>
              ) : null}
            </View>
          ) : null}
          {attemptPresentation.action === 'update' ? (
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
          {attemptPresentation.action &&
          attemptPresentation.action !== 'update' ? (
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
                    : attemptPresentation.action === 'installer'
                      ? 'Continue installation'
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
