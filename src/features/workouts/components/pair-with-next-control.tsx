import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { iconSizes } from '@/src/theme/sizes';
import { LinkIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface PairWithNextControlProps {
  onPress: () => void;
}

export function PairWithNextControl({ onPress }: PairWithNextControlProps) {
  return (
    <View className="mt-4 ml-12 flex-row items-center gap-3 pb-1">
      <View className="bg-border h-7 w-px" />
      <Button
        variant="secondary"
        size="sm"
        className="min-h-0 rounded-full px-3 py-2"
        textClassName="text-muted-foreground text-sm"
        leftIcon={
          <Icon as={LinkIcon} size={iconSizes.xs} tone="mutedForeground" />
        }
        onPress={onPress}
      >
        Pair with next
      </Button>
    </View>
  );
}
