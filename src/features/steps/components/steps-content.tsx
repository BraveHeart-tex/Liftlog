import { StyledFlatList } from '@/src/components/styled/flat-list';
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
import { TodayStepRadialCard } from '@/src/features/steps/components/today-step-radial-card';
import { useStepsScreen } from '@/src/features/steps/hooks/use-steps-screen';
import { getAvailabilityLabel } from '@/src/features/steps/steps-display.utils';
import { EllipsisIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

const RECENT_STEP_HISTORY_LIMIT = 7;

export function StepsContent() {
  const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);
  const {
    availability,
    displayedTodaySteps,
    errorMessage,
    hasStepRecords,
    hasTodayStepRecord,
    healthConnectStepsEnabled,
    isLoading,
    isSyncing,
    permissions,
    stats,
    stepDays,
    stepGoal,
    connectSteps,
    openHealthConnectSettings,
    refreshSteps
  } = useStepsScreen();
  const recentStepDays = stepDays.slice(0, RECENT_STEP_HISTORY_LIMIT);
  const hasMoreStepHistory = stepDays.length > recentStepDays.length;
  const progress =
    stepGoal > 0
      ? Math.min(100, Math.round((displayedTodaySteps / stepGoal) * 100))
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
  const shouldShowToday = hasTodayStepRecord;
  const shouldUseCompactToday = hasTodayStepRecord && displayedTodaySteps === 0;
  const shouldShowRecentActivity = hasStepRecords;
  const openActionsSheet = useCallback(() => setIsActionsSheetOpen(true), []);
  const closeActionsSheet = useCallback(() => setIsActionsSheetOpen(false), []);

  if (isLoading) {
    return <LoadingState label="Loading steps..." />;
  }

  if (shouldShowInitialSyncState) {
    return <LoadingState label="Syncing steps..." />;
  }

  if (shouldShowDataUnavailableState) {
    return (
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
    );
  }

  return (
    <>
      <StyledFlatList
        data={recentStepDays}
        keyExtractor={item => item.dateKey}
        style={{ flex: 1 }}
        contentContainerClassName="px-4 pt-4 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-6">
            <View className="flex-row items-start justify-between gap-4">
              <StepsConnectionBadge isConnected={isConnected} />

              <Button
                variant="secondary"
                size="icon"
                accessibilityLabel="Open step actions"
                onPress={openActionsSheet}
              >
                <Icon as={EllipsisIcon} size="md" tone="secondaryForeground" />
              </Button>
            </View>

            {errorMessage ? (
              <View className="border-danger bg-card mt-4 rounded-lg border px-4 py-3">
                <Text variant="small" tone="danger">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {shouldShowToday ? (
              <TodayStepRadialCard
                compact={shouldUseCompactToday}
                steps={displayedTodaySteps}
                goal={stepGoal}
                progress={progress}
              />
            ) : null}

            {shouldShowRecentActivity ? (
              <StepsSummaryCards
                recentActivityStatus={stats.recentActivityStatus}
                stepGoal={stepGoal}
              />
            ) : null}

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
          <EmptyState
            layout="section"
            title="No step history"
            description="Sync steps to fill this in."
            className="border-border bg-card rounded-lg border border-dashed px-6 py-10"
          />
        }
        ListFooterComponent={
          hasMoreStepHistory ? (
            <Text variant="caption" tone="muted" className="pt-3 text-center">
              Showing latest {recentStepDays.length} of {stepDays.length} synced
              days
            </Text>
          ) : null
        }
        renderItem={({ item }) => <StepDayRow day={item} goal={stepGoal} />}
      />
      <StepsActionsSheet
        availabilityLabel={availabilityLabel}
        isOpen={isActionsSheetOpen}
        isSyncing={isSyncing}
        onClose={closeActionsSheet}
        onManage={openHealthConnectSettings}
        onRefresh={refreshSteps}
      />
    </>
  );
}
