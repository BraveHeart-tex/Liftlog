import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Text } from '@/src/components/ui/text';
import { StepDayRow } from '@/src/features/steps/components/step-day-row';
import { StepsActionsSheet } from '@/src/features/steps/components/steps-actions-sheet';
import { StepsConnectionBadge } from '@/src/features/steps/components/steps-connection-badge';
import { StepsEmptyState } from '@/src/features/steps/components/steps-empty-state';
import { StepsSummaryCards } from '@/src/features/steps/components/steps-summary-cards';
import { StepsUnavailableState } from '@/src/features/steps/components/steps-unavailable-state';
import { useStepsScreen } from '@/src/features/steps/hooks/use-steps-screen';
import { getRecentLocalDayRanges } from '@/src/features/steps/steps-date.utils';
import {
  formatStepMonthDay,
  formatStepWeekday,
  formatStepWeekdayShort,
  formatSteps,
  getAvailabilityLabel
} from '@/src/features/steps/steps-display.utils';
import { Stack } from 'expo-router';
import { EllipsisIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

const STEP_CHART_DAY_COUNT = 7;

export function StepsContent() {
  const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);
  const {
    availability,
    errorMessage,
    hasStepRecords,
    healthConnectStepsEnabled,
    isLoading,
    isSyncing,
    permissions,
    stats,
    stepDays,
    stepGoal,
    displayedTodaySteps,
    connectSteps,
    openHealthConnectSettings,
    refreshSteps
  } = useStepsScreen();
  const stepDaysByDateKey = new Map(stepDays.map(day => [day.dateKey, day]));
  const recentCalendarDays = getRecentLocalDayRanges(STEP_CHART_DAY_COUNT).map(
    range => ({
      dateKey: range.dateKey,
      startAt: range.startAt,
      steps: stepDaysByDateKey.get(range.dateKey)?.steps ?? 0
    })
  );
  const recentStepDays = hasStepRecords
    ? [...recentCalendarDays].reverse()
    : [];
  const today = recentCalendarDays[recentCalendarDays.length - 1];
  const bestDay = recentCalendarDays.reduce(
    (best, day) => (best === null || day.steps > best.steps ? day : best),
    null as (typeof recentCalendarDays)[number] | null
  );
  const hasFullWeek = stats.recentActivityStatus.averageSteps !== null;
  const chartMaxSteps = Math.max(
    1,
    ...recentCalendarDays.map(day => day.steps)
  );
  const progress =
    stepGoal > 0
      ? Math.min(100, Math.round((today.steps / stepGoal) * 100))
      : 0;
  const shouldConnectSteps =
    !permissions.canReadSteps || !healthConnectStepsEnabled;
  const isConnected = !shouldConnectSteps;
  const availabilityLabel = getAvailabilityLabel(availability);
  const isStepTrackingUnavailable = availability !== 'available';
  const shouldShowDataUnavailableState =
    isStepTrackingUnavailable || shouldConnectSteps;
  const shouldShowInitialSyncState =
    !shouldShowDataUnavailableState && isSyncing && !hasStepRecords;
  const openActionsSheet = useCallback(() => setIsActionsSheetOpen(true), []);
  const closeActionsSheet = useCallback(() => setIsActionsSheetOpen(false), []);
  const nativeHeader = (
    <Stack.Screen
      options={{
        headerRight: () => (
          <Button
            variant="ghost"
            size="icon"
            accessibilityLabel="Open step actions"
            onPress={openActionsSheet}
          >
            <Icon as={EllipsisIcon} size="lg" tone="foreground" />
          </Button>
        )
      }}
    />
  );

  if (isLoading) {
    return (
      <>
        {nativeHeader}
        <LoadingState label="Loading steps..." />
      </>
    );
  }

  if (shouldShowInitialSyncState) {
    return (
      <>
        {nativeHeader}
        <LoadingState label="Syncing steps..." />
      </>
    );
  }

  if (shouldShowDataUnavailableState) {
    return (
      <>
        {nativeHeader}
        <StyledScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-4 pt-4 pb-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StepsConnectionBadge
            availabilityLabel={
              isStepTrackingUnavailable ? availabilityLabel : undefined
            }
            isConnected={isConnected}
          />

          {errorMessage ? (
            <View className="border-danger bg-card mt-4 rounded-lg border px-4 py-3">
              <Text variant="small" tone="danger">
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
      </>
    );
  }

  return (
    <>
      {nativeHeader}
      <StyledScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-4 pt-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepsConnectionBadge isConnected={isConnected} />

        {errorMessage ? (
          <View className="border-danger bg-card mt-4 rounded-lg border px-4 py-3">
            <Text variant="small" tone="danger">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <View className="mt-5">
          <Text variant="small" tone="muted">
            Today · {formatStepWeekday(today.startAt)},{' '}
            {formatStepMonthDay(today.startAt)}
          </Text>
          <Text
            variant="h1"
            className="mt-1"
            style={{ fontSize: 40, lineHeight: 46 }}
          >
            {formatSteps(displayedTodaySteps)}{' '}
            <Text variant="body" tone="muted">
              steps
            </Text>
          </Text>
          <Text variant="small" tone="muted" className="mt-2">
            {stepGoal <= 0
              ? 'Set a daily goal to track progress.'
              : today.steps >= stepGoal
                ? `Goal exceeded by ${formatSteps(today.steps - stepGoal)} steps`
                : `${formatSteps(stepGoal - today.steps)} steps to your ${formatSteps(stepGoal)} goal`}
          </Text>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`${progress}% of daily step goal`}
            className="bg-secondary mt-3 h-1.5 overflow-hidden rounded-full"
          >
            <View
              className="bg-primary h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        <StepsSummaryCards
          averageSteps={stats.recentActivityStatus.averageSteps}
          bestDay={hasFullWeek ? bestDay : null}
          syncedDayCount={stats.recentActivityStatus.syncedDayCount}
          requiredDayCount={stats.recentActivityStatus.requiredDayCount}
        />

        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Daily steps for the last seven days: ${recentCalendarDays
            .map(
              day =>
                `${formatStepWeekday(day.startAt)}, ${formatSteps(day.steps)} steps`
            )
            .join('; ')}`}
          className="mt-7"
        >
          <Text variant="bodyMedium">Last 7 days</Text>
          <Text variant="caption" tone="muted" className="mt-1">
            Daily steps
          </Text>
          <View className="border-border mt-3 h-40 border-b">
            <View className="h-32 flex-row items-end gap-2">
              {recentCalendarDays.map((day, index) => {
                const barHeight = Math.max(
                  3,
                  Math.round((day.steps / chartMaxSteps) * 100)
                );
                const isToday = index === recentCalendarDays.length - 1;

                return (
                  <View
                    key={day.dateKey}
                    className="h-full flex-1 items-center justify-end"
                  >
                    <View
                      className={
                        isToday
                          ? 'bg-primary w-4 rounded-t-md'
                          : 'bg-secondary w-4 rounded-t-md'
                      }
                      style={{ height: `${barHeight}%` }}
                    />
                  </View>
                );
              })}
            </View>
            <View className="h-8 flex-row items-center gap-2">
              {recentCalendarDays.map(day => (
                <View key={day.dateKey} className="flex-1 items-center">
                  <Text variant="caption" tone="muted">
                    {formatStepWeekdayShort(day.startAt)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-7">
          <Text variant="bodyMedium">Recent days</Text>
          {hasStepRecords ? (
            <View className="mt-2">
              {recentStepDays.map(day => (
                <StepDayRow
                  key={day.dateKey}
                  day={day}
                  isToday={day.dateKey === today.dateKey}
                />
              ))}
            </View>
          ) : (
            <EmptyState className="border-border bg-card mt-2 rounded-lg border border-dashed px-6 py-8">
              <EmptyState.Title variant="bodyMedium">
                No step history
              </EmptyState.Title>
              <EmptyState.Description>
                Sync steps to fill this in.
              </EmptyState.Description>
            </EmptyState>
          )}
        </View>

        <Text variant="caption" tone="muted" className="mt-6">
          Step history is synced from Health Connect when available. LiftLog
          keeps the synced data on this device.
        </Text>
      </StyledScrollView>

      {isActionsSheetOpen ? (
        <StepsActionsSheet
          availabilityLabel={availabilityLabel}
          isOpen
          isSyncing={isSyncing}
          onClose={closeActionsSheet}
          onManage={openHealthConnectSettings}
          onRefresh={refreshSteps}
        />
      ) : null}
    </>
  );
}
