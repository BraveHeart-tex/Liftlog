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
import { useHistoricalWorkoutStart } from '@/src/features/workouts/hooks';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { ChevronRightIcon, PlusIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkoutLogStartSheetProps {
  dateKey: string;
  isOpen: boolean;
  onClose: () => void;
}

function getDateKeyTimestamp(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

export function WorkoutLogStartSheet({
  dateKey,
  isOpen,
  onClose
}: WorkoutLogStartSheetProps) {
  const insets = useSafeAreaInsets();
  const { templates, startBlankWorkout, startWorkoutFromTemplate, isLoading } =
    useHistoricalWorkoutStart(dateKey);
  const selectedDateLabel = formatWorkoutDate(
    getDateKeyTimestamp(dateKey),
    'full'
  );

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
          className="w-full"
          disabled={isLoading}
          leftIcon={<Icon icon={PlusIcon} tone="primaryForeground" />}
          onPress={handleStartBlank}
        >
          Start blank
        </Button>

        <View>
          <Text variant="overline" tone="muted">
            Templates
          </Text>

          {templates.length === 0 ? (
            <Text variant="small" tone="muted" className="mt-3">
              Saved templates will show here.
            </Text>
          ) : (
            <View className="mt-3 gap-3">
              {templates.map(item => (
                <PressableSurface
                  key={item.template.id}
                  className="border-border bg-card min-h-20 flex-row items-center gap-3 rounded-lg border px-4 py-3"
                  onPress={() => handleStartTemplate(item.template.id)}
                >
                  <View className="min-w-0 flex-1">
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {item.template.name}
                    </Text>
                    <Text variant="caption" tone="muted" className="mt-1">
                      {item.exerciseCount === 1
                        ? '1 exercise'
                        : `${item.exerciseCount} exercises`}
                    </Text>
                    <Text variant="small" tone="muted" numberOfLines={1}>
                      {item.exerciseSummary}
                    </Text>
                  </View>
                  <Icon icon={ChevronRightIcon} tone="mutedForeground" />
                </PressableSurface>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: insets.bottom + 16 }} />
      </BottomSheetContent>
    </BottomSheet>
  );
}
