import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { InputGroup } from '@/src/components/ui/input-group';
import { Input } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import { StyledActivityIndicator } from '@/src/components/styled/activity-indicator';
import {
  formatTrackingValue,
  getSetValues,
  type TrackingFieldDefinition,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import type { useSettings } from '@/src/features/settings/hooks/use-settings';
import { SetDurationField } from '@/src/features/workouts/components/set-duration-field';
import {
  SetFormFieldSurface,
  SetFormSaveSurface,
  type SetFormFieldColors,
  type SetFormFieldTone
} from '@/src/features/workouts/components/set-form/set-form-field-surface';
import { SetFormRowActions } from '@/src/features/workouts/components/set-form/set-form-row-actions';
import type { SetFormRow as SetFormRowModel } from '@/src/features/workouts/components/set-form/set-form.types';
import { getFieldHeaderLabel } from '@/src/features/workouts/components/set-form/set-form.utils';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { CheckIcon } from 'lucide-react-native';
import { cn } from '@/src/lib/utils/cn.utils';
import { useEffect, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated';

const TRAILING_REGION_WIDTH = 56;
const rowEaseOut = Easing.bezier(0.23, 1, 0.32, 1);
const rowEntering = FadeInUp.duration(MOTION_DURATION_MS.standard)
  .easing(rowEaseOut)
  .withInitialValues({
    opacity: 0,
    transform: [{ translateY: 8 }]
  });
const rowEnteringAfterEmpty = rowEntering.delay(MOTION_DURATION_MS.exit);
const rowExiting = FadeOut.duration(MOTION_DURATION_MS.exit).easing(rowEaseOut);
const rowLayout = LinearTransition.springify().dampingRatio(1).stiffness(200);
const saveStateEntering = FadeIn.duration(MOTION_DURATION_MS.pressIn).easing(
  rowEaseOut
);
const saveStateExiting = FadeOut.duration(MOTION_DURATION_MS.pressOut).easing(
  rowEaseOut
);
const emptyInputSelection = { start: 0, end: 0 };

interface SetFormRowProps {
  row: SetFormRowModel;
  trackingType: TrackingType;
  trackingFields: TrackingFieldDefinition[];
  weightUnit: ReturnType<typeof useSettings>['weightUnit'];
  fieldColors: SetFormFieldColors;
  hasPendingCopy: boolean;
  shouldDelayEntering?: boolean;
  onFieldChange: (
    row: SetFormRowModel,
    field: TrackingFieldDefinition,
    value: string
  ) => void;
  onCommit: (row: SetFormRowModel) => Promise<void>;
  onCopy: (row: SetFormRowModel) => Promise<void>;
  onDelete: (row: SetFormRowModel) => void;
  onOpenDurationPicker: (
    row: SetFormRowModel,
    field: TrackingFieldDefinition
  ) => void;
  onRowFocus?: (rowKey: string) => void;
  onRowLayout?: (
    rowKey: string,
    layout: LayoutChangeEvent['nativeEvent']['layout']
  ) => void;
}

export function SetFormRow({
  row,
  trackingType,
  trackingFields,
  weightUnit,
  fieldColors,
  hasPendingCopy,
  shouldDelayEntering = false,
  onFieldChange,
  onCommit,
  onCopy,
  onDelete,
  onOpenDurationPicker,
  onRowFocus,
  onRowLayout
}: SetFormRowProps) {
  const reduceMotion = useReducedMotion();
  const isValid = Boolean(row.validatedValues);
  const fieldTone = getRowFieldTone(row, isValid);
  const isCopyDisabled = !isValid || row.isSaving || hasPendingCopy;
  const previousValue = row.previousSet
    ? formatTrackingValue(
        trackingType,
        getSetValues(row.previousSet),
        weightUnit
      )
    : '-';
  const entering =
    row.animateOnMount && !reduceMotion
      ? shouldDelayEntering
        ? rowEnteringAfterEmpty
        : rowEntering
      : undefined;

  return (
    <Animated.View
      entering={entering}
      exiting={reduceMotion ? undefined : rowExiting}
      layout={reduceMotion ? undefined : rowLayout}
      onLayout={event => onRowLayout?.(row.key, event.nativeEvent.layout)}
    >
      <ReanimatedSwipeable
        overshootRight={false}
        containerStyle={{ borderRadius: 8, overflow: 'hidden' }}
        renderRightActions={(_progress, _translation, swipeable) => (
          <SetFormRowActions
            setNumber={row.setNumber}
            isCopyDisabled={isCopyDisabled}
            shouldCloseBeforeDelete={row.kind === 'persisted'}
            swipeable={swipeable}
            onCopy={() => {
              void onCopy(row);
            }}
            onDelete={() => {
              onDelete(row);
            }}
          />
        )}
      >
        <SetFormRowContent
          row={row}
          trackingFields={trackingFields}
          weightUnit={weightUnit}
          previousValue={previousValue}
          fieldTone={fieldTone}
          fieldColors={fieldColors}
          isValid={isValid}
          onFieldChange={onFieldChange}
          onCommit={onCommit}
          onOpenDurationPicker={onOpenDurationPicker}
          onRowFocus={onRowFocus}
        />
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

function SetFormRowContent({
  row,
  trackingFields,
  weightUnit,
  previousValue,
  fieldTone,
  fieldColors,
  isValid,
  onFieldChange,
  onCommit,
  onOpenDurationPicker,
  onRowFocus
}: {
  row: SetFormRowModel;
  trackingFields: TrackingFieldDefinition[];
  weightUnit: ReturnType<typeof useSettings>['weightUnit'];
  previousValue: string;
  fieldTone: SetFormFieldTone;
  fieldColors: SetFormFieldColors;
  isValid: boolean;
  onFieldChange: SetFormRowProps['onFieldChange'];
  onCommit: SetFormRowProps['onCommit'];
  onOpenDurationPicker: SetFormRowProps['onOpenDurationPicker'];
  onRowFocus: SetFormRowProps['onRowFocus'];
}) {
  const lastField = trackingFields.at(-1);
  const leadingFields = trackingFields.slice(0, -1);

  return (
    <View className="bg-card gap-3 rounded-lg px-3 py-3">
      <View className="flex-row items-start gap-2">
        <View className="w-8 items-center">
          <Text variant="bodyMedium">{row.setNumber}</Text>
        </View>
        <Text variant="small" tone="muted" className="min-w-0 flex-1">
          Previous · {previousValue}
        </Text>
      </View>

      <View className="flex-row items-end gap-2">
        {leadingFields.map(field => (
          <View key={field.key} className="min-w-0 flex-1 gap-1">
            <Text variant="overline" tone="muted">
              {getFieldHeaderLabel(field, weightUnit)}
            </Text>
            <SetFormEditableField
              row={row}
              field={field}
              fieldTone={fieldTone}
              fieldColors={fieldColors}
              isValid={isValid}
              className="min-w-0"
              onFieldChange={onFieldChange}
              onOpenDurationPicker={onOpenDurationPicker}
              onRowFocus={onRowFocus}
            />
          </View>
        ))}

        {lastField ? (
          <View
            className="min-w-0 flex-1 gap-1"
            style={{ flexBasis: TRAILING_REGION_WIDTH }}
          >
            <Text variant="overline" tone="muted">
              {getFieldHeaderLabel(lastField, weightUnit)}
            </Text>
            <View className="flex-row items-end gap-2">
              <View className="min-w-0 flex-1">
                <SetFormEditableField
                  row={row}
                  field={lastField}
                  fieldTone={fieldTone}
                  fieldColors={fieldColors}
                  isValid={isValid}
                  className="min-w-0"
                  onFieldChange={onFieldChange}
                  onOpenDurationPicker={onOpenDurationPicker}
                  onRowFocus={onRowFocus}
                />
              </View>

              <SetFormTrailingRegion
                row={row}
                fieldTone={fieldTone}
                fieldColors={fieldColors}
                isValid={isValid}
                onCommit={onCommit}
              />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SetFormEditableField({
  row,
  field,
  fieldTone,
  fieldColors,
  isValid,
  className,
  onFieldChange,
  onOpenDurationPicker,
  onRowFocus
}: {
  row: SetFormRowModel;
  field: TrackingFieldDefinition;
  fieldTone: SetFormFieldTone;
  fieldColors: SetFormFieldColors;
  isValid: boolean;
  className?: string;
  onFieldChange: SetFormRowProps['onFieldChange'];
  onOpenDurationPicker: SetFormRowProps['onOpenDurationPicker'];
  onRowFocus: SetFormRowProps['onRowFocus'];
}) {
  const value = row.fieldValues[field.key] ?? '';

  return (
    <SetFormFieldSurface
      tone={fieldTone}
      colors={fieldColors}
      className={className}
    >
      {field.key === 'durationMs' ? (
        <SetDurationField
          value={value}
          placeholder="0:00.00"
          disabled={row.isSaving}
          isCommitted={row.isCommitted}
          isValid={isValid}
          surfaceClassName="border-transparent bg-transparent"
          accessibilityLabel={`Set ${row.setNumber} ${field.label.toLowerCase()}`}
          onPress={() => onOpenDurationPicker(row, field)}
        />
      ) : (
        <View className="relative">
          <InputGroup className="min-h-12 rounded-lg border-transparent bg-transparent px-1 py-0">
            <Input
              value={value}
              onChangeText={value => onFieldChange(row, field, value)}
              keyboardType={field.keyboardType}
              placeholder=""
              editable={!row.isSaving}
              onFocus={() => onRowFocus?.(row.key)}
              className={cn(
                'text-body-medium h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 py-2',
                row.isCommitted && 'text-muted-foreground'
              )}
              selection={value.length === 0 ? emptyInputSelection : undefined}
              textAlign="center"
              accessibilityLabel={`Set ${row.setNumber} ${field.label.toLowerCase()}`}
            />
          </InputGroup>
          {value.length === 0 ? (
            <View
              pointerEvents="none"
              className="absolute inset-0 items-center justify-center"
            >
              <Text variant="bodyMedium" tone="muted">
                0
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </SetFormFieldSurface>
  );
}

function SetFormTrailingRegion({
  row,
  fieldTone,
  fieldColors,
  isValid,
  onCommit
}: {
  row: SetFormRowModel;
  fieldTone: SetFormFieldTone;
  fieldColors: SetFormFieldColors;
  isValid: boolean;
  onCommit: SetFormRowProps['onCommit'];
}) {
  const reduceMotion = useReducedMotion();
  const [shouldAnimateSaveState, setShouldAnimateSaveState] = useState(false);
  const showCommitAction = isValid && !row.isCommitted && !row.isSaving;

  useEffect(() => {
    setShouldAnimateSaveState(true);
  }, []);

  return (
    <View className="h-12 w-12">
      <SetFormSaveSurface tone={fieldTone} colors={fieldColors}>
        {row.isSaving ? (
          <Animated.View
            key="saving"
            entering={
              shouldAnimateSaveState && !reduceMotion
                ? saveStateEntering
                : undefined
            }
            exiting={
              shouldAnimateSaveState && !reduceMotion
                ? saveStateExiting
                : undefined
            }
            accessible
            accessibilityLabel={`Saving set ${row.setNumber}`}
            accessibilityRole="progressbar"
            className="absolute inset-0 items-center justify-center"
          >
            <StyledActivityIndicator className="text-primary" size="small" />
          </Animated.View>
        ) : (
          <Animated.View
            key="commit"
            entering={
              shouldAnimateSaveState && !reduceMotion
                ? saveStateEntering
                : undefined
            }
            exiting={
              shouldAnimateSaveState && !reduceMotion
                ? saveStateExiting
                : undefined
            }
            className="absolute inset-0"
          >
            <Button
              variant={showCommitAction ? 'secondary' : 'ghost'}
              size="icon"
              disabled={!showCommitAction}
              accessibilityLabel={`Commit set ${row.setNumber}`}
              className="h-12 w-12 border-transparent bg-transparent"
              onPress={() => void onCommit(row)}
            >
              <Icon
                as={CheckIcon}
                tone={showCommitAction ? 'primary' : 'mutedForeground'}
                size="md"
              />
            </Button>
          </Animated.View>
        )}
      </SetFormSaveSurface>
    </View>
  );
}

function getRowFieldTone(
  row: SetFormRowModel,
  isValid: boolean
): SetFormFieldTone {
  if (row.phase === 'error') {
    return 'error';
  }

  if (row.isSaving) {
    return 'valid';
  }

  if (row.isCommitted) {
    return 'neutral';
  }

  return isValid ? 'valid' : 'neutral';
}
