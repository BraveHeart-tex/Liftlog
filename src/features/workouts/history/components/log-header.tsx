import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { ChevronRightIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface LogHeaderProps {
  onOpenSteps: () => void;
}

export function LogHeader({ onOpenSteps }: LogHeaderProps) {
  return (
    <View className="min-h-11 flex-row items-center justify-between gap-4">
      <Text variant="h1">Log</Text>
      <PressableSurface
        accessibilityLabel="Open steps"
        accessibilityRole="button"
        className="min-h-11 -translate-y-0.5 flex-row items-center gap-1 rounded-md pl-3"
        onPress={onOpenSteps}
        pressedClassName="opacity-70"
      >
        <Text variant="bodyMedium" tone="secondaryForeground">
          Steps
        </Text>
        <Icon as={ChevronRightIcon} size="sm" tone="secondaryForeground" />
      </PressableSurface>
    </View>
  );
}
