import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { ExerciseNameField } from '@/src/features/exercises/components/exercise-name-field';
import { ExerciseEquipmentPickerSheet } from '@/src/features/exercises/components/exercise-equipment-picker-sheet';
import { ExerciseMusclePickerSheet } from '@/src/features/exercises/components/exercise-muscle-picker-sheet';
import { ExerciseTrackingPickerSheet } from '@/src/features/exercises/components/exercise-tracking-picker-sheet';
import {
  CATEGORY_FILTERS,
  type ExerciseCategory
} from '@/src/features/exercises/exercise.constants';
import {
  TRACKING_TYPE_DEFINITIONS,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { cn } from '@/src/lib/utils/cn.utils';
import { toTitleCase } from '@/src/lib/utils/string.utils';
import {
  ChevronRightIcon,
  DumbbellIcon,
  HeartPulseIcon,
  ListPlusIcon
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

interface ExerciseMetadataFormProps {
  equipment: ExerciseCategory | null;
  trackingType?: TrackingType;
  selectedPrimaryMuscles: string[];
  selectedSecondaryMuscles: string[];
  name?: string;
  nameError?: string;
  inputVariant?: 'default' | 'bottom-sheet';
  errorScrollRequestId?: number;
  onScrollToError?: (y: number) => void;
  setName?: (name: string) => void;
  setEquipment: (equipment: ExerciseCategory | null) => void;
  setTrackingType: (trackingType: TrackingType) => void;
  togglePrimaryMuscle: (muscle: string) => void;
  toggleSecondaryMuscle: (muscle: string) => void;
}

const ERROR_SCROLL_OFFSET = 16;

interface FocusableInput {
  focus: () => void;
}

function formatTrackingType(trackingType?: TrackingType) {
  if (!trackingType) {
    return 'Not set';
  }

  return toTitleCase(
    TRACKING_TYPE_DEFINITIONS[trackingType].label.replace(' and ', ' + ')
  );
}

function formatEquipment(equipment: ExerciseCategory | null) {
  return (
    CATEGORY_FILTERS.find(option => option.value === equipment)?.label ??
    'Not set'
  );
}

function formatMuscles(primaryMuscles: string[], secondaryMuscles: string[]) {
  const muscles = [...primaryMuscles, ...secondaryMuscles];

  if (muscles.length === 0) {
    return 'Not set';
  }

  const firstMuscle = toTitleCase(muscles[0]);

  return muscles.length === 1
    ? firstMuscle
    : `${firstMuscle} +${muscles.length - 1}`;
}

interface SetupRowProps {
  icon: typeof ListPlusIcon;
  label: string;
  description: string;
  value: string;
  showDivider: boolean;
  onPress: () => void;
}

function SetupRow({
  icon,
  label,
  description,
  value,
  showDivider,
  onPress
}: SetupRowProps) {
  return (
    <PressableSurface
      accessibilityLabel={`${label}. ${description}. ${value}`}
      accessibilityRole="button"
      className={cn(
        'border-border min-h-16 flex-row items-center gap-4 py-3',
        showDivider && 'border-b'
      )}
      onPress={onPress}
    >
      <View className="w-7 items-center">
        <Icon as={icon} tone="mutedForeground" />
      </View>
      <View className="min-w-0 flex-1">
        <Text variant="bodyMedium">{label}</Text>
        <Text variant="small" tone="muted" className="mt-0.5">
          {description}
        </Text>
      </View>
      <Text
        variant="small"
        tone="muted"
        className="max-w-32 shrink text-right"
        numberOfLines={1}
      >
        {value}
      </Text>
      <Icon as={ChevronRightIcon} tone="mutedForeground" />
    </PressableSurface>
  );
}

export function ExerciseMetadataForm({
  equipment,
  trackingType,
  selectedPrimaryMuscles,
  selectedSecondaryMuscles,
  name,
  nameError,
  inputVariant = 'default',
  errorScrollRequestId,
  onScrollToError,
  setName,
  setEquipment,
  setTrackingType,
  togglePrimaryMuscle,
  toggleSecondaryMuscle
}: ExerciseMetadataFormProps) {
  const shouldShowNameField = typeof name === 'string' && Boolean(setName);
  const [openSheet, setOpenSheet] = useState<
    'tracking' | 'equipment' | 'muscles' | null
  >(null);
  const nameInputRef = useRef<FocusableInput | null>(null);
  const nameSectionY = useRef(0);
  const lastHandledErrorScrollRequestId = useRef<number | undefined>(undefined);

  const recordNameSectionLayout = useCallback((event: LayoutChangeEvent) => {
    nameSectionY.current = event.nativeEvent.layout.y;
  }, []);

  const setNameInputRef = useCallback(
    (input: FocusableInput | null | undefined) => {
      nameInputRef.current = input ?? null;
    },
    []
  );

  useEffect(() => {
    if (
      errorScrollRequestId === undefined ||
      errorScrollRequestId === lastHandledErrorScrollRequestId.current ||
      !nameError
    ) {
      return;
    }

    lastHandledErrorScrollRequestId.current = errorScrollRequestId;
    onScrollToError?.(Math.max(nameSectionY.current - ERROR_SCROLL_OFFSET, 0));
    nameInputRef.current?.focus();
  }, [errorScrollRequestId, nameError, onScrollToError]);

  return (
    <>
      <View>
        {shouldShowNameField ? (
          <ExerciseNameField
            name={name}
            error={nameError}
            inputVariant={inputVariant}
            onLayout={recordNameSectionLayout}
            onInputRef={setNameInputRef}
            onChangeName={setName}
          />
        ) : null}

        <View className={cn(shouldShowNameField ? 'mt-6' : undefined)}>
          <Text variant="overline" tone="muted">
            Setup
          </Text>

          <View className="border-border mt-2 border-t">
            <SetupRow
              icon={ListPlusIcon}
              label="Track sets as"
              description="Controls the fields used while logging"
              value={formatTrackingType(trackingType)}
              showDivider
              onPress={() => setOpenSheet('tracking')}
            />
            <SetupRow
              icon={DumbbellIcon}
              label="Equipment"
              description="Optional"
              value={formatEquipment(equipment)}
              showDivider
              onPress={() => setOpenSheet('equipment')}
            />
            <SetupRow
              icon={HeartPulseIcon}
              label="Muscles"
              description="Optional"
              value={formatMuscles(
                selectedPrimaryMuscles,
                selectedSecondaryMuscles
              )}
              showDivider={false}
              onPress={() => setOpenSheet('muscles')}
            />
          </View>

          <View className="border-border mt-3 border-t pt-3">
            <Text variant="caption" tone="muted">
              Equipment and muscle details can be added now or later.
            </Text>
          </View>
        </View>
      </View>

      <ExerciseTrackingPickerSheet
        isOpen={openSheet === 'tracking'}
        selectedTrackingType={trackingType}
        onClose={() => setOpenSheet(null)}
        onSelectTrackingType={setTrackingType}
      />
      <ExerciseEquipmentPickerSheet
        isOpen={openSheet === 'equipment'}
        selectedEquipment={equipment}
        onClose={() => setOpenSheet(null)}
        onSelectEquipment={setEquipment}
      />
      <ExerciseMusclePickerSheet
        isOpen={openSheet === 'muscles'}
        selectedPrimaryMuscles={selectedPrimaryMuscles}
        selectedSecondaryMuscles={selectedSecondaryMuscles}
        onClose={() => setOpenSheet(null)}
        onTogglePrimaryMuscle={togglePrimaryMuscle}
        onToggleSecondaryMuscle={toggleSecondaryMuscle}
      />
    </>
  );
}
