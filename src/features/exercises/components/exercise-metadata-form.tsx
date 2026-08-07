import { ExerciseCategorySelector } from '@/src/features/exercises/components/exercise-category-selector';
import { ExerciseMuscleSelector } from '@/src/features/exercises/components/exercise-muscle-selector';
import { ExerciseNameField } from '@/src/features/exercises/components/exercise-name-field';
import { ExerciseTrackingStyleSelector } from '@/src/features/exercises/components/exercise-tracking-style-selector';
import type { ExerciseCategory } from '@/src/features/exercises/exercise.constants';
import type { TrackingType } from '@/src/features/progress/tracking.domain';
import { scheduleIdleTask } from '@/src/lib/utils/schedule-idle-task.utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, View, type LayoutChangeEvent } from 'react-native';

interface ExerciseMetadataFormProps {
  category: ExerciseCategory;
  trackingType: TrackingType;
  selectedPrimaryMuscles: string[];
  selectedSecondaryMuscles: string[];
  name?: string;
  nameError?: string;
  primaryMusclesError?: string;
  secondaryMusclesError?: string;
  inputVariant?: 'default' | 'bottom-sheet';
  errorScrollRequestId?: number;
  onScrollToError?: (y: number) => void;
  setName?: (name: string) => void;
  setCategory: (category: ExerciseCategory) => void;
  setTrackingType: (trackingType: TrackingType) => void;
  togglePrimaryMuscle: (muscle: string) => void;
  toggleSecondaryMuscle: (muscle: string) => void;
}

type ErrorTarget = 'name' | 'primaryMuscles' | 'secondaryMuscles';

interface FocusableInput {
  focus: () => void;
}

const ERROR_SCROLL_OFFSET = 16;

export function ExerciseMetadataForm({
  category,
  trackingType,
  selectedPrimaryMuscles,
  selectedSecondaryMuscles,
  name,
  nameError,
  primaryMusclesError,
  secondaryMusclesError,
  inputVariant = 'default',
  errorScrollRequestId,
  onScrollToError,
  setName,
  setCategory,
  setTrackingType,
  togglePrimaryMuscle,
  toggleSecondaryMuscle
}: ExerciseMetadataFormProps) {
  const shouldShowNameField = typeof name === 'string' && Boolean(setName);
  const shouldShowSecondaryMusclesImmediately =
    selectedSecondaryMuscles.length > 0 || Boolean(secondaryMusclesError);
  const [shouldRenderSecondaryMuscles, setShouldRenderSecondaryMuscles] =
    useState(shouldShowSecondaryMusclesImmediately);
  const nameInputRef = useRef<FocusableInput | null>(null);
  const lastHandledErrorScrollRequestId = useRef<number | undefined>(undefined);
  const sectionYByTarget = useRef<Record<ErrorTarget, number>>({
    name: 0,
    primaryMuscles: 0,
    secondaryMuscles: 0
  });

  const recordNameSectionLayout = useCallback((event: LayoutChangeEvent) => {
    sectionYByTarget.current.name = event.nativeEvent.layout.y;
  }, []);
  const recordPrimaryMusclesSectionLayout = useCallback(
    (event: LayoutChangeEvent) => {
      sectionYByTarget.current.primaryMuscles = event.nativeEvent.layout.y;
    },
    []
  );
  const recordSecondaryMusclesSectionLayout = useCallback(
    (event: LayoutChangeEvent) => {
      sectionYByTarget.current.secondaryMuscles = event.nativeEvent.layout.y;
    },
    []
  );
  const setNameInputRef = useCallback(
    (input: FocusableInput | null | undefined) => {
      nameInputRef.current = input ?? null;
    },
    []
  );

  useEffect(() => {
    if (shouldRenderSecondaryMuscles) {
      return;
    }

    if (shouldShowSecondaryMusclesImmediately) {
      setShouldRenderSecondaryMuscles(true);

      return;
    }

    return scheduleIdleTask(() => {
      setShouldRenderSecondaryMuscles(true);
    });
  }, [shouldRenderSecondaryMuscles, shouldShowSecondaryMusclesImmediately]);

  useEffect(() => {
    if (
      errorScrollRequestId === undefined ||
      errorScrollRequestId === lastHandledErrorScrollRequestId.current
    ) {
      return;
    }

    const firstErrorTarget = nameError
      ? 'name'
      : primaryMusclesError
        ? 'primaryMuscles'
        : secondaryMusclesError
          ? 'secondaryMuscles'
          : undefined;

    if (!firstErrorTarget) {
      return;
    }

    if (
      firstErrorTarget === 'secondaryMuscles' &&
      !shouldRenderSecondaryMuscles
    ) {
      return;
    }

    lastHandledErrorScrollRequestId.current = errorScrollRequestId;

    const targetY = Math.max(
      sectionYByTarget.current[firstErrorTarget] - ERROR_SCROLL_OFFSET,
      0
    );

    if (firstErrorTarget !== 'name') {
      Keyboard.dismiss();
    }

    onScrollToError?.(targetY);

    if (firstErrorTarget === 'name') {
      nameInputRef.current?.focus();
    }
  }, [
    errorScrollRequestId,
    nameError,
    onScrollToError,
    primaryMusclesError,
    secondaryMusclesError,
    shouldRenderSecondaryMuscles
  ]);

  return (
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

      <ExerciseCategorySelector
        category={category}
        hasNameField={shouldShowNameField}
        onSelectCategory={setCategory}
      />

      <ExerciseTrackingStyleSelector
        trackingType={trackingType}
        onSelectTrackingType={setTrackingType}
      />

      <ExerciseMuscleSelector
        title="4. Primary muscles"
        hint="Pick at least one."
        selectedMuscles={selectedPrimaryMuscles}
        error={primaryMusclesError}
        onLayout={recordPrimaryMusclesSectionLayout}
        onToggleMuscle={togglePrimaryMuscle}
      />

      {shouldRenderSecondaryMuscles ? (
        <ExerciseMuscleSelector
          title="5. Secondary muscles"
          hint="Optional. Selecting a muscle here removes it from primary."
          selectedMuscles={selectedSecondaryMuscles}
          error={secondaryMusclesError}
          onLayout={recordSecondaryMusclesSectionLayout}
          onToggleMuscle={toggleSecondaryMuscle}
        />
      ) : null}
    </View>
  );
}
