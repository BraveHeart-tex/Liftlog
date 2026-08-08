import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db/schema';
import {
  TRACKING_TYPE_DEFINITIONS,
  type SetValues,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { SetDurationPickerSheet } from '@/src/features/workouts/components/set-duration-picker-sheet';
import { SetFormEmptyState } from '@/src/features/workouts/components/set-form/set-form-empty-state';
import type { SetFormFieldColors } from '@/src/features/workouts/components/set-form/set-form-field-surface';
import { SetFormRow } from '@/src/features/workouts/components/set-form/set-form-row';
import { useSetFormController } from '@/src/features/workouts/components/set-form/use-set-form-controller';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { PlusIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Keyframe,
  LinearTransition,
  useReducedMotion
} from 'react-native-reanimated';

const lightFeedbackColors = {
  danger: '#e8294a',
  success: '#34c76a'
} as const;

const darkFeedbackColors = {
  danger: '#f65170',
  success: '#1f9e4a'
} as const;

const formEaseOut = Easing.bezier(0.23, 1, 0.32, 1);
const formStateEntering = FadeIn.duration(MOTION_DURATION_MS.standard).easing(
  formEaseOut
);
const formStateExiting = FadeOut.duration(MOTION_DURATION_MS.exit).easing(
  formEaseOut
);
const emptyStateEntering = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 0.97 }]
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: formEaseOut
  }
}).duration(MOTION_DURATION_MS.standard);
const emptyStateExiting = new Keyframe({
  0: {
    opacity: 1,
    transform: [{ scale: 1 }]
  },
  100: {
    opacity: 0,
    transform: [{ scale: 0.97 }],
    easing: formEaseOut
  }
}).duration(MOTION_DURATION_MS.exit);
const formLayout = LinearTransition.springify().dampingRatio(1).stiffness(200);

interface SetFormProps {
  trackingType: TrackingType;
  sets: Set[];
  previousSets: Set[];
  enableStopwatch?: boolean;
  onRowFocus?: (rowKey: string) => void;
  onRowLayout?: (
    rowKey: string,
    layout: LayoutChangeEvent['nativeEvent']['layout']
  ) => void;
  onAddSet: (
    data: SetValues & { order: Set['order'] },
    options?: { shouldScrollAfterMutation?: boolean }
  ) => Set | Promise<Set>;
  onUpdateSet: (
    data: SetValues & { setId: Set['id'] }
  ) => Set | undefined | Promise<Set | undefined>;
  onDeleteSet: (setId: Set['id']) => void | Promise<void>;
}

export function SetForm({
  trackingType,
  sets,
  previousSets,
  enableStopwatch = false,
  onRowFocus,
  onRowLayout,
  onAddSet,
  onUpdateSet,
  onDeleteSet
}: SetFormProps) {
  const reduceMotion = useReducedMotion();
  const [shouldAnimateStateChange, setShouldAnimateStateChange] =
    useState(false);
  const { weightUnit } = useSettings();
  const { colors, colorScheme } = useAppTheme();
  const trackingDefinition = TRACKING_TYPE_DEFINITIONS[trackingType];
  const feedbackColors =
    colorScheme === 'dark' ? darkFeedbackColors : lightFeedbackColors;
  const animatedFieldColors = useMemo<SetFormFieldColors>(
    () => ({
      border: [
        'transparent',
        colors.primary,
        feedbackColors.success,
        feedbackColors.danger
      ],
      background: [
        colors.muted,
        `${colors.primary}1A`,
        `${feedbackColors.success}1A`,
        `${feedbackColors.danger}1A`
      ]
    }),
    [colors.muted, colors.primary, feedbackColors]
  );

  const controller = useSetFormController({
    trackingType,
    trackingDefinition,
    weightUnit,
    sets,
    previousSets,
    onAddSet,
    onUpdateSet,
    onDeleteSet
  });
  const hasRows = controller.rows.length > 0;
  const layoutTransition = reduceMotion ? undefined : formLayout;

  useEffect(() => {
    setShouldAnimateStateChange(true);
  }, []);

  return (
    <View className="flex-1">
      <View className="gap-2">
        {controller.rows.map(row => (
          <SetFormRow
            key={row.key}
            row={row}
            trackingType={trackingType}
            trackingFields={trackingDefinition.fields}
            weightUnit={weightUnit}
            fieldColors={animatedFieldColors}
            hasPendingCopy={controller.hasPendingCopy}
            onFieldChange={controller.updateFieldValue}
            onCommit={controller.commitRow}
            onCopy={controller.copyRow}
            onDelete={controller.deleteRow}
            onOpenDurationPicker={controller.openDurationPicker}
            onRowFocus={onRowFocus}
            onRowLayout={onRowLayout}
          />
        ))}
      </View>

      {hasRows ? (
        <Animated.View
          key="controls"
          entering={shouldAnimateStateChange ? formStateEntering : undefined}
          exiting={shouldAnimateStateChange ? formStateExiting : undefined}
          layout={layoutTransition}
        >
          <Button
            onPress={controller.addDraftRow}
            className="mt-4 bg-transparent"
            leftIcon={<Icon as={PlusIcon} tone="foreground" size="sm" />}
            variant="secondary"
          >
            <Text variant="bodyMedium">Add Set</Text>
          </Button>

          {sets.length > 0 ? (
            <Animated.View
              entering={
                shouldAnimateStateChange ? formStateEntering : undefined
              }
              exiting={shouldAnimateStateChange ? formStateExiting : undefined}
            >
              <Text variant="caption" tone="muted" className="mt-3 text-center">
                Swipe left on a row to copy or delete it.
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      ) : (
        <Animated.View
          key="empty"
          entering={
            shouldAnimateStateChange
              ? reduceMotion
                ? formStateEntering
                : emptyStateEntering
              : undefined
          }
          exiting={
            shouldAnimateStateChange
              ? reduceMotion
                ? formStateExiting
                : emptyStateExiting
              : undefined
          }
          layout={layoutTransition}
        >
          <SetFormEmptyState onAddSet={controller.addDraftRow} />
        </Animated.View>
      )}
      <SetDurationPickerSheet
        isOpen={Boolean(controller.activeDurationPicker)}
        valueMs={controller.activeDurationValueMs}
        enableStopwatch={enableStopwatch}
        onClose={controller.closeDurationPicker}
        onConfirm={controller.confirmDuration}
      />
    </View>
  );
}
