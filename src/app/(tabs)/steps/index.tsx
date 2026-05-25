import { StyledFlatList } from '@/src/components/styled/flat-list';
import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Text } from '@/src/components/ui/text';
import { StepDayRow } from '@/src/features/steps/components/step-day-row';
import { StepProgressChart } from '@/src/features/steps/components/step-progress-chart';
import { TodayStepRadialCard } from '@/src/features/steps/components/today-step-radial-card';
import {
  formatSteps,
  getAvailabilityLabel,
  getLiveStepCounterBadgeLabel,
  getLiveStepCounterMessage
} from '@/src/features/steps/display';
import { useStepsScreen } from '@/src/features/steps/hooks';
import { cn } from '@/src/lib/utils/cn';
import {
  HeartIcon,
  PlusIcon,
  RefreshCwIcon,
  SettingsIcon
} from 'lucide-react-native';
import { View } from 'react-native';

interface StepsConnectionBadgeProps {
  isConnected: boolean;
}

function StepsConnectionBadge({ isConnected }: StepsConnectionBadgeProps) {
  return (
    <Badge
      className={cn(
        'will-change-variable flex flex-row items-center',
        isConnected
          ? 'bg-success/10 dark:bg-success/20'
          : 'bg-secondary dark:bg-secondary/20'
      )}
    >
      <View
        className={cn(
          'will-change-variable h-2 w-2 rounded-full',
          isConnected
            ? 'dark:bg-success bg-success/50'
            : 'bg-secondary-foreground/50 dark:bg-secondary'
        )}
      />
      <Text
        variant="caption"
        className={cn(
          'will-change-variable',
          isConnected ? 'text-success' : 'text-secondary-foreground'
        )}
      >
        {isConnected ? 'Health Connect synced' : 'Not Connected'}
      </Text>
    </Badge>
  );
}

interface StepsEmptyStateProps {
  isSyncing: boolean;
  onConnect: () => void;
}

function StepsEmptyState({ isSyncing, onConnect }: StepsEmptyStateProps) {
  return (
    <View className="flex-1 justify-center pt-16 pb-16">
      <View className="items-center">
        <View className="bg-card h-40 w-40 items-center justify-center rounded-full">
          <Icon icon={HeartIcon} size={56} className="text-primary" />
          <View className="bg-primary border-background absolute right-3 bottom-4 h-12 w-12 items-center justify-center rounded-full border-4">
            <Icon
              icon={PlusIcon}
              size="lg"
              className="text-primary-foreground"
            />
          </View>
        </View>

        <Text variant="h1" className="mt-7 text-center">
          Connect Health Data
        </Text>
        <Text variant="body" tone="muted" className="mt-4 max-w-80 text-center">
          See today&apos;s progress, weekly trends, and goal consistency from
          your Health Connect step data.
        </Text>
      </View>

      <Button
        size="lg"
        className="mt-10 w-full"
        loading={isSyncing}
        onPress={onConnect}
      >
        Connect Health Connect
      </Button>

      <View className="bg-card mt-7 rounded-lg px-5 py-4">
        <Text variant="bodyMedium">Your data stays on device</Text>
        <Text variant="small" tone="muted" className="mt-2">
          LiftLog reads steps only. No data is sent to external servers.
        </Text>
      </View>
    </View>
  );
}

export default function StepsScreen() {
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
  } = useStepsScreen();
  const newestFirstDays = [...stepDays].sort((a, b) => b.startAt - a.startAt);
  const progress =
    stepGoal > 0
      ? Math.min(100, Math.round((displayedTodaySteps / stepGoal) * 100))
      : 0;
  const shouldConnectSteps =
    !permissions.canReadSteps || !healthConnectStepsEnabled;
  const isConnected = !shouldConnectSteps;
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
        <LoadingState label="Loading steps..." />
      </SafeAreaView>
    );
  }

  if (shouldConnectSteps) {
    return (
      <SafeAreaView
        style={{ flex: 1 }}
        className="bg-background"
        edges={['top']}
      >
        <StyledScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-4 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1 gap-1">
              <Text variant="h1">Steps</Text>
              <StepsConnectionBadge isConnected={isConnected} />
            </View>
          </View>

          {errorMessage ? (
            <View className="border-danger bg-card mt-4 rounded-lg border px-4 py-3">
              <Text variant="small" className="text-danger">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <StepsEmptyState isSyncing={isSyncing} onConnect={connectSteps} />
        </StyledScrollView>
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
              <View className="flex-1 gap-1">
                <Text variant="h1">Steps</Text>
                <StepsConnectionBadge isConnected={isConnected} />
              </View>

              <Button
                variant="secondary"
                size="icon"
                accessibilityLabel="Refresh steps"
                disabled={!permissions.canReadSteps || isSyncing}
                onPress={refreshSteps}
              >
                <Icon
                  icon={RefreshCwIcon}
                  size="md"
                  className="text-secondary-foreground"
                />
              </Button>
            </View>

            {errorMessage ? (
              <View className="border-danger bg-card mt-4 rounded-lg border px-4 py-3">
                <Text variant="small" className="text-danger">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <TodayStepRadialCard
              steps={displayedTodaySteps}
              goal={stepGoal}
              progress={progress}
              liveStepCounterBadgeLabel={liveStepCounterBadgeLabel}
              liveStepCounterMessage={liveStepCounterMessage}
              liveStepCounterStatus={liveStepCounterStatus}
            />

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
                        <Icon
                          icon={SettingsIcon}
                          size="sm"
                          className="text-secondary-foreground"
                        />
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
                  Step history
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
