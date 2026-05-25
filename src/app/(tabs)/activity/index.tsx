import { StyledFlatList } from '@/src/components/styled/flat-list';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Text } from '@/src/components/ui/text';
import { StepDayRow } from '@/src/features/activity/components/step-day-row';
import { StepProgressChart } from '@/src/features/activity/components/step-progress-chart';
import { useActivityScreen } from '@/src/features/activity/hooks';
import { ActivityIcon, RefreshCwIcon, SettingsIcon } from 'lucide-react-native';
import { View } from 'react-native';

function formatSteps(steps: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0
  }).format(steps);
}

function getAvailabilityLabel(availability: string): string {
  if (availability === 'available') {
    return 'Health Connect ready';
  }

  if (availability === 'provider_update_required') {
    return 'Health Connect update required';
  }

  if (availability === 'unsupported') {
    return 'Android only';
  }

  return 'Health Connect unavailable';
}

function getLiveStepCounterBadgeLabel(status: string, liveStepDelta: number) {
  if (status === 'active') {
    return liveStepDelta > 0 ? `Live +${formatSteps(liveStepDelta)}` : 'Live';
  }

  if (status === 'checking') {
    return 'Starting live';
  }

  return null;
}

function getLiveStepCounterMessage(
  status: string,
  errorMessage: string | null
): string | null {
  if (status === 'permission_denied') {
    return 'Allow Activity Recognition to show live steps.';
  }

  if (status === 'unavailable' || status === 'no_sensor') {
    return 'Live step counting is not available on this device.';
  }

  if (status === 'error') {
    return errorMessage ?? 'Live step counting stopped.';
  }

  return null;
}

export default function ActivityScreen() {
  const {
    availability,
    displayedTodaySteps,
    errorMessage,
    healthConnectStepsEnabled,
    isLoading,
    isSyncing,
    liveStepCounterError,
    liveStepCounterStatus,
    liveStepDelta,
    permissions,
    stats,
    stepDays,
    stepGoal,
    connectSteps,
    openHealthConnectSettings,
    refreshSteps
  } = useActivityScreen();
  const newestFirstDays = [...stepDays].sort((a, b) => b.startAt - a.startAt);
  const progress = Math.min(
    100,
    Math.round((displayedTodaySteps / stepGoal) * 100)
  );
  const shouldConnectSteps =
    !permissions.canReadSteps || !healthConnectStepsEnabled;
  const liveStepCounterBadgeLabel = getLiveStepCounterBadgeLabel(
    liveStepCounterStatus,
    liveStepDelta
  );
  const liveStepCounterMessage = getLiveStepCounterMessage(
    liveStepCounterStatus,
    liveStepCounterError
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1 }}
        className="bg-background"
        edges={['top']}
      >
        <LoadingState label="Loading activity..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <StyledFlatList
        data={newestFirstDays}
        keyExtractor={item => item.dateKey}
        style={{ flex: 1 }}
        contentContainerClassName="px-4 py-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-6">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text variant="h1">Activity</Text>
                <Text variant="small" tone="muted" className="mt-2">
                  Steps from Health Connect.
                </Text>
              </View>

              <Button
                variant="secondary"
                size="icon"
                accessibilityLabel="Refresh steps"
                disabled={!permissions.canReadSteps || isSyncing}
                onPress={refreshSteps}
              >
                <Icon icon={RefreshCwIcon} size="md" />
              </Button>
            </View>

            {errorMessage ? (
              <View className="border-danger bg-card mt-4 rounded-lg border px-4 py-3">
                <Text variant="small" className="text-danger">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <Card className="mt-6">
              <CardContent>
                <View className="flex-row items-center justify-between gap-4">
                  <View className="flex-1">
                    <Text variant="caption" tone="muted">
                      Today
                    </Text>
                    <Text variant="h1" className="mt-1">
                      {formatSteps(displayedTodaySteps)}
                    </Text>
                    <Text variant="small" tone="muted" className="mt-1">
                      {progress}% of {formatSteps(stepGoal)}
                    </Text>
                    {liveStepCounterBadgeLabel ? (
                      <Badge
                        variant={
                          liveStepCounterStatus === 'active'
                            ? 'success'
                            : 'outline'
                        }
                        label={liveStepCounterBadgeLabel}
                        className="mt-3"
                      />
                    ) : null}
                    {liveStepCounterMessage ? (
                      <Text variant="caption" tone="muted" className="mt-3">
                        {liveStepCounterMessage}
                      </Text>
                    ) : null}
                  </View>

                  <View className="bg-muted h-16 w-16 items-center justify-center rounded-xl">
                    <Icon
                      icon={ActivityIcon}
                      size="xl"
                      className="text-primary"
                    />
                  </View>
                </View>

                <View className="bg-muted mt-5 h-3 overflow-hidden rounded-sm">
                  <View
                    className="bg-primary h-full"
                    style={{ width: `${progress}%` }}
                  />
                </View>
              </CardContent>
            </Card>

            <View className="mt-4 flex-row gap-3">
              <Card className="flex-1">
                <CardContent>
                  <Text variant="caption" tone="muted">
                    7-day avg
                  </Text>
                  <Text variant="h3" className="mt-2">
                    {formatSteps(stats.average7DaySteps)}
                  </Text>
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardContent>
                  <Text variant="caption" tone="muted">
                    Best day
                  </Text>
                  <Text variant="h3" className="mt-2">
                    {formatSteps(stats.bestDay?.steps ?? 0)}
                  </Text>
                </CardContent>
              </Card>
            </View>

            <Card className="mt-4">
              <CardContent>
                <View className="flex-row items-center justify-between gap-4">
                  <View className="flex-1">
                    <Text variant="bodyMedium">
                      {getAvailabilityLabel(availability)}
                    </Text>
                    <Text variant="caption" tone="muted" className="mt-1">
                      {permissions.canReadSteps
                        ? healthConnectStepsEnabled
                          ? 'Step access is enabled.'
                          : 'Step access is available but disabled in LiftLog.'
                        : 'Connect steps to start caching history.'}
                    </Text>
                  </View>

                  <Button
                    variant={shouldConnectSteps ? 'primary' : 'secondary'}
                    size="sm"
                    loading={isSyncing}
                    onPress={
                      shouldConnectSteps
                        ? connectSteps
                        : openHealthConnectSettings
                    }
                    leftIcon={
                      shouldConnectSteps ? undefined : (
                        <Icon icon={SettingsIcon} size="sm" />
                      )
                    }
                  >
                    {shouldConnectSteps
                      ? permissions.canReadSteps
                        ? 'Enable'
                        : 'Connect'
                      : 'Manage'}
                  </Button>
                </View>
              </CardContent>
            </Card>

            <StepProgressChart days={stepDays} goal={stepGoal} />

            <View className="mt-6 flex-row items-end justify-between gap-4">
              <View>
                <Text variant="caption" tone="muted">
                  History
                </Text>
                <Text variant="h3" className="mt-1">
                  Daily steps
                </Text>
              </View>
              <Text variant="caption" tone="muted">
                {newestFirstDays.length} days
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="border-border bg-card items-center justify-center rounded-lg border border-dashed px-6 py-10">
            <Text variant="h3" className="text-center">
              No step history
            </Text>
            <Text variant="small" tone="muted" className="mt-2 text-center">
              Connect Health Connect and sync steps to fill this in.
            </Text>
          </View>
        }
        renderItem={({ item }) => <StepDayRow day={item} goal={stepGoal} />}
      />
    </SafeAreaView>
  );
}
