import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { CopyIcon, Trash2Icon } from 'lucide-react-native';
import { View } from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

interface SetFormRowActionsProps {
  setNumber: number;
  isCopyDisabled: boolean;
  shouldCloseBeforeDelete: boolean;
  swipeable: SwipeableMethods;
  onCopy: () => void;
  onDelete: () => void;
}

export function SetFormRowActions({
  setNumber,
  isCopyDisabled,
  shouldCloseBeforeDelete,
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
        className="bg-primary/10 h-16 w-16 rounded-lg border-transparent"
        onPress={() => {
          swipeable.close();
          onCopy();
        }}
      >
        <Icon as={CopyIcon} tone="primary" size="md" />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        accessibilityLabel={`Delete set ${setNumber}`}
        className="bg-danger/10 h-16 w-16 rounded-lg border-transparent"
        onPress={() => {
          if (shouldCloseBeforeDelete) {
            swipeable.close();
          }

          onDelete();
        }}
      >
        <Icon as={Trash2Icon} tone="danger" size="md" />
      </Button>
    </View>
  );
}
