import { StyledFlatList } from '@/src/components/styled/flat-list';
import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Text } from '@/src/components/ui/text';
import { StepDayRow } from '@/src/features/steps/components/step-day-row';
import { StepsConnectionBadge } from '@/src/features/steps/components/steps-connection-badge';
import { StepsEmptyState } from '@/src/features/steps/components/steps-empty-state';
import { StepsGoalConsistencyCard } from '@/src/features/steps/components/steps-goal-consistency-card';
import { StepsSummaryCards } from '@/src/features/steps/components/steps-summary-cards';
import { StepsUnavailableState } from '@/src/features/steps/components/steps-unavailable-state';
import { TodayStepRadialCard } from '@/src/features/steps/components/today-step-radial-card';
import {
  getAvailabilityLabel,
  getLiveStepCounterBadgeLabel,
  getLiveStepCounterMessage
} from '@/src/features/steps/display';
import { useStepsScreen } from '@/src/features/steps/hooks';
import { RefreshCwIcon, SettingsIcon } from 'lucide-react-native';
import { View } from 'react-native';

const RECENT_STEP_HISTORY_LIMIT = 7;

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
  const recentStepDays = newestFirstDays.slice(0, RECENT_STEP_HISTORY_LIMIT);
  const hasMoreStepHistory = newestFirstDays.length > recentStepDays.length;
  const progress =
    stepGoal > 0
      ? Math.min(100, Math.round((displayedTodaySteps / stepGoal) * 100))
      : 0;
  const shouldConnectSteps =
    !permissions.canReadSteps || !healthConnectStepsEnabled;
  const isConnected = !shouldConnectSteps;
  const availabilityLabel = getAvailabilityLabel(availability);
  const isStepTrackingUnavailable = availability !== 'available';
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

  if (isStepTrackingUnavailable || shouldConnectSteps) {
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
              <StepsConnectionBadge
                availabilityLabel={
                  isStepTrackingUnavailable ? availabilityLabel : undefined
                }
                isConnected={isConnected}
              />
            </View>
          </View>

          {errorMessage ? (
            <View className="border-danger bg-card mt-4 rounded-lg border px-4 py-3">
              <Text variant="small" className="text-danger">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {isStepTrackingUnavailable ? (
            <StepsUnavailableState availability={availability} />
          ) : (
            <StepsEmptyState isSyncing={isSyncing} onConnect={connectSteps} />
          )}
        </StyledScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <StyledFlatList
        data={recentStepDays}
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

            <Card className="mt-4">
              <CardContent>
                <View className="flex-row items-center justify-between gap-4">
                  <View className="flex-1">
                    <Text variant="bodyMedium">{availabilityLabel}</Text>
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

            <StepsGoalConsistencyCard days={stepDays} goal={stepGoal} />
            <StepsSummaryCards
              average7DaySteps={stats.average7DaySteps}
              bestDay={stats.bestDay}
              todaySteps={displayedTodaySteps}
            />

            <View className="mt-6 flex-row items-end justify-between gap-4">
              <View>
                <Text variant="caption" tone="muted">
                  Step history
                </Text>
                <Text variant="h3" className="mt-1">
                  Recent days
                </Text>
              </View>
              <Text variant="caption" tone="muted">
                {recentStepDays.length} shown
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
        ListFooterComponent={
          hasMoreStepHistory ? (
            <Text variant="caption" tone="muted" className="pt-3 text-center">
              Showing latest {recentStepDays.length} of {newestFirstDays.length}{' '}
              synced days
            </Text>
          ) : null
        }
        renderItem={({ item }) => <StepDayRow day={item} goal={stepGoal} />}
      />
    </SafeAreaView>
  );
}
