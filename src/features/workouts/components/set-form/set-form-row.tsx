import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Input } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
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
import { CheckIcon } from 'lucide-react-native';
import { View, type LayoutChangeEvent } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated';

const rowEntering = FadeInDown.duration(MOTION_DURATION_MS.standard);
const rowExiting = FadeOut.duration(MOTION_DURATION_MS.exit);
const rowLayout = LinearTransition.duration(MOTION_DURATION_MS.standard);

interface SetFormRowProps {
  row: SetFormRowModel;
  trackingType: TrackingType;
  trackingFields: TrackingFieldDefinition[];
  weightUnit: ReturnType<typeof useSettings>['weightUnit'];
  fieldColors: SetFormFieldColors;
  hasPendingCopy: boolean;
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
  onFieldChange,
  onCommit,
  onCopy,
  onDelete,
  onOpenDurationPicker,
  onRowFocus,
  onRowLayout
}: SetFormRowProps) {
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

  return (
    <Animated.View
      entering={row.animateOnMount ? rowEntering : undefined}
      exiting={rowExiting}
      layout={rowLayout}
      onLayout={event => onRowLayout?.(row.key, event.nativeEvent.layout)}
    >
      <ReanimatedSwipeable
        overshootRight={false}
        containerStyle={{ borderRadius: 8, overflow: 'hidden' }}
        renderRightActions={(_progress, _translation, swipeable) => (
          <SetFormRowActions
            setNumber={row.setNumber}
            isCopyDisabled={isCopyDisabled}
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
        {trackingFields.map(field => (
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

        <SetFormSaveButton
          row={row}
          fieldTone={fieldTone}
          fieldColors={fieldColors}
          isValid={isValid}
          onCommit={onCommit}
        />
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
  return (
    <SetFormFieldSurface
      tone={fieldTone}
      colors={fieldColors}
      className={className}
    >
      {field.key === 'durationMs' ? (
        <SetDurationField
          value={row.fieldValues[field.key] ?? ''}
          placeholder="0:00.00"
          disabled={row.isSaving}
          isCommitted={row.isCommitted}
          isValid={isValid}
          surfaceClassName="border-transparent bg-transparent"
          accessibilityLabel={`Set ${row.setNumber} ${field.label.toLowerCase()}`}
          onPress={() => onOpenDurationPicker(row, field)}
        />
      ) : (
        <Input
          value={row.fieldValues[field.key] ?? ''}
          onChangeText={value => onFieldChange(row, field, value)}
          keyboardType={field.keyboardType}
          placeholder="0"
          withContainerDefaults={false}
          editable={!row.isSaving}
          onFocus={() => onRowFocus?.(row.key)}
          containerClassName="min-h-12 flex-row items-center rounded-lg px-1"
          inputClassName="text-body-medium min-w-0 flex-1 px-2 py-2"
          textAlign="center"
          accessibilityLabel={`Set ${row.setNumber} ${field.label.toLowerCase()}`}
        />
      )}
    </SetFormFieldSurface>
  );
}

function SetFormSaveButton({
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
  return (
    <SetFormSaveSurface
      tone={fieldTone}
      isCommitted={row.isCommitted}
      colors={fieldColors}
    >
      <Button
        variant={isValid ? 'secondary' : 'ghost'}
        size="icon"
        disabled={!isValid || row.isSaving}
        accessibilityLabel={`Save set ${row.setNumber}`}
        className="h-12 w-12 border-transparent bg-transparent"
        onPress={() => void onCommit(row)}
      >
        <Icon
          as={CheckIcon}
          tone={
            row.isCommitted
              ? 'success'
              : isValid
                ? 'primary'
                : 'mutedForeground'
          }
          size="md"
        />
      </Button>
    </SetFormSaveSurface>
  );
}

function getRowFieldTone(
  row: SetFormRowModel,
  isValid: boolean
): SetFormFieldTone {
  if (row.phase === 'error') {
    return 'error';
  }

  if (row.isCommitted) {
    return 'committed';
  }

  return isValid ? 'valid' : 'neutral';
}
