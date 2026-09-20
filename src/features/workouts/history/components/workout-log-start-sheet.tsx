import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { useHistoricalWorkoutStart } from '@/src/features/workouts/history/hooks/use-historical-workout-start';
import { ChevronRightIcon, PlusIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface WorkoutLogStartSheetProps {
  dateKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkoutLogStartSheet({
  dateKey,
  isOpen,
  onClose
}: WorkoutLogStartSheetProps) {
  const {
    templates,
    selectedDateLabel,
    startBlankWorkout,
    startWorkoutFromTemplate,
    isLoading
  } = useHistoricalWorkoutStart(dateKey, { enabled: isOpen });

  const handleStartBlank = () => {
    onClose();
    requestAnimationFrame(startBlankWorkout);
  };

  const handleStartTemplate = (templateId: string) => {
    onClose();
    requestAnimationFrame(() => startWorkoutFromTemplate(templateId));
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['65%', '90%']}>
      <BottomSheetHeader>
        <BottomSheetTitle>Log workout</BottomSheetTitle>
        <BottomSheetDescription>
          {`Create a workout for ${selectedDateLabel}.`}
        </BottomSheetDescription>
      </BottomSheetHeader>

      <BottomSheetContent className="gap-4">
        <Button
          fullWidth
          leftIcon={<Icon as={PlusIcon} tone="primaryForeground" />}
          onPress={handleStartBlank}
        >
          Start blank
        </Button>

        <View>
          <Text variant="overline" tone="muted">
            Templates
          </Text>

          {isLoading ? (
            <Text variant="small" tone="muted" className="mt-3">
              Loading templates...
            </Text>
          ) : templates.length === 0 ? (
            <Text variant="small" tone="muted" className="mt-3">
              Saved templates will show here.
            </Text>
          ) : (
            <View className="mt-3 gap-3">
              {templates.map(item => (
                <PressableSurface
                  key={item.id}
                  className="border-border bg-card min-h-20 flex-row items-center gap-3 rounded-lg border px-4 py-3"
                  onPress={() => handleStartTemplate(item.id)}
                >
                  <View className="min-w-0 flex-1">
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="caption" tone="muted" className="mt-1">
                      {item.exerciseCountLabel}
                    </Text>
                    <Text variant="small" tone="muted" numberOfLines={1}>
                      {item.exerciseSummary}
                    </Text>
                  </View>
                  <Icon as={ChevronRightIcon} tone="mutedForeground" />
                </PressableSurface>
              ))}
            </View>
          )}
        </View>
      </BottomSheetContent>
    </BottomSheet>
  );
}
