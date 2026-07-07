import { StyledBottomSheetTextInput } from '@/src/components/styled/bottom-sheet';
import { StyledGestureScrollView } from '@/src/components/styled/scroll-view';
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetSafeFooter,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { ChoiceChip } from '@/src/components/ui/chip';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import {
  MAX_STEP_GOAL,
  MIN_STEP_GOAL,
  STEP_GOAL_PRESETS
} from '@/src/features/steps/steps.constants';
import { isValidStepGoal } from '@/src/features/steps/steps.validation';
import { nativeFontSizes } from '@/src/theme/sizes';
import { SaveIcon, XIcon } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, View } from 'react-native';

const numberFormatter = new Intl.NumberFormat();

function formatStepGoal(goal: number) {
  return numberFormatter.format(goal);
}

export const StepGoalSheet = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      enableDynamicSizing
      keyboardBehavior="interactive"
    >
      <StepGoalSheetContent isOpen={isOpen} onClose={handleClose} />
    </BottomSheet>
  );
};

const StepGoalSheetContent = memo(function StepGoalSheetContent({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { stepGoal, setStepGoal } = useSettings();
  const [draftValue, setDraftValue] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftValue(String(stepGoal));
  }, [isOpen, stepGoal]);

  const draftGoal = useMemo(() => {
    if (!draftValue) {
      return undefined;
    }

    const parsed = Number.parseInt(draftValue, 10);

    return Number.isFinite(parsed) ? parsed : undefined;
  }, [draftValue]);

  const formattedDraftValue =
    draftGoal === undefined ? '' : formatStepGoal(draftGoal);

  const errorMessage =
    draftGoal === undefined || isValidStepGoal(draftGoal)
      ? undefined
      : draftGoal < MIN_STEP_GOAL
        ? `Use at least ${formatStepGoal(MIN_STEP_GOAL)} steps.`
        : `Use no more than ${formatStepGoal(MAX_STEP_GOAL)} steps.`;

  const canSave = draftGoal !== undefined && isValidStepGoal(draftGoal);

  const handleGoalChange = (value: string) => {
    setDraftValue(value.replace(/\D/g, ''));
  };

  const handlePresetPress = (preset: number) => {
    setDraftValue(String(preset));
  };

  const handleSave = () => {
    if (!canSave || draftGoal === undefined) {
      return;
    }

    setStepGoal(draftGoal);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <BottomSheetHeader className="flex-row items-center justify-between">
        <BottomSheetTitle>Step goal</BottomSheetTitle>
        <Button
          variant="secondary"
          size="icon"
          onPress={handleClose}
          accessibilityLabel="Close step goal sheet"
          className="px-0"
        >
          <Icon as={XIcon} size="lg" tone="foreground" />
        </Button>
      </BottomSheetHeader>

      <View className="gap-8 px-4 pt-10">
        <View className="items-center">
          <StyledBottomSheetTextInput
            value={formattedDraftValue}
            onChangeText={handleGoalChange}
            keyboardType="number-pad"
            returnKeyType="done"
            placeholder="10,000"
            placeholderClassName="text-muted-foreground"
            selectionClassName="text-primary"
            style={{
              fontSize: nativeFontSizes.stepGoalInput,
              fontVariant: ['tabular-nums'],
              textAlign: 'center'
            }}
            className="text-foreground w-full font-bold"
            selectTextOnFocus
            maxLength={7}
            onSubmitEditing={handleSave}
          />
          <Text tone="muted" className="text-body mt-1" variant="h3">
            steps
          </Text>
          {errorMessage ? (
            <Text variant="caption" tone="danger" className="mt-3">
              {errorMessage}
            </Text>
          ) : null}
        </View>

        <StyledGestureScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          directionalLockEnabled
          nestedScrollEnabled
          contentContainerClassName="gap-2 pr-4"
        >
          {STEP_GOAL_PRESETS.map(preset => {
            return (
              <ChoiceChip
                key={preset}
                onPress={() => {
                  handlePresetPress(preset);
                }}
                selected={draftGoal === preset}
              >
                {formatStepGoal(preset)}
              </ChoiceChip>
            );
          })}
        </StyledGestureScrollView>
      </View>
      <BottomSheetSafeFooter className="pb-safe-offset-4 flex-col gap-0 pt-8">
        <Button
          className="rounded-xl"
          disabled={!canSave}
          containerClassName="w-full"
          leftIcon={<Icon as={SaveIcon} tone="primaryForeground" />}
          onPress={handleSave}
        >
          Save goal
        </Button>
      </BottomSheetSafeFooter>
    </>
  );
});
