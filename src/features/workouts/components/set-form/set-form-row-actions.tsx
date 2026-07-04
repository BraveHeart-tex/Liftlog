import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { CopyIcon, Trash2Icon } from 'lucide-react-native';
import { View } from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

interface SetFormRowActionsProps {
  setNumber: number;
  isCopyDisabled: boolean;
  swipeable: SwipeableMethods;
  onCopy: () => void;
  onDelete: () => void;
}

export function SetFormRowActions({
  setNumber,
  isCopyDisabled,
  swipeable,
  onCopy,
  onDelete
}: SetFormRowActionsProps) {
  return (
    <View className="h-full flex-row items-center gap-2 pl-2">
      <Button
        variant="secondary"
        size="icon"
        disabled={isCopyDisabled}
        accessibilityLabel={`Copy set ${setNumber}`}
        className="border-primary/30 bg-primary/10 h-16 w-16 rounded-lg"
        onPress={() => {
          swipeable.close();
          onCopy();
        }}
      >
        <Icon
          as={CopyIcon}
          tone={isCopyDisabled ? 'mutedForeground' : 'primary'}
          size="md"
        />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        accessibilityLabel={`Delete set ${setNumber}`}
        className="border-danger/30 bg-danger/10 h-16 w-16 rounded-lg"
        onPress={() => {
          swipeable.close();
          onDelete();
        }}
      >
        <Icon as={Trash2Icon} tone="danger" size="md" />
      </Button>
    </View>
  );
}
