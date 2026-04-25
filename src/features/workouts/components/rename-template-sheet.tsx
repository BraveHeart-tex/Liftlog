import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { BottomSheetInput } from '@/src/components/ui/bottom-sheet-input';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { XIcon } from 'lucide-react-native';
import { useEffect, useRef, type ComponentRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RenameTemplateSheetProps {
  isOpen: boolean;
  templateName: string;
  error?: string;
  isSaving: boolean;
  onChangeTemplateName: (name: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

type BottomSheetInputRef = ComponentRef<typeof BottomSheetInput>;

export function RenameTemplateSheet({
  isOpen,
  templateName,
  error,
  isSaving,
  onChangeTemplateName,
  onClose,
  onSubmit
}: RenameTemplateSheetProps) {
  const insets = useSafeAreaInsets();
  const templateInputRef = useRef<BottomSheetInputRef>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer = setTimeout(() => {
      templateInputRef.current?.focus();
      templateInputRef.current?.setSelection(0, templateName.length);
    }, 150);

    return () => clearTimeout(focusTimer);
  }, [isOpen, templateName]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      enableDynamicSizing
      keyboardBehavior="interactive"
    >
      <BottomSheetHeader className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <BottomSheetTitle>Rename template</BottomSheetTitle>
          <BottomSheetDescription>
            Update the name shown on your workout start screen.
          </BottomSheetDescription>
        </View>
        <Button variant="ghost" size="icon" onPress={onClose}>
          <Icon icon={XIcon} size={20} className="text-foreground" />
        </Button>
      </BottomSheetHeader>

      <View className="px-4 pt-4">
        <BottomSheetInput
          ref={templateInputRef}
          label="Template name"
          value={templateName}
          onChangeText={onChangeTemplateName}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          maxLength={80}
          error={error}
          blurOnSubmit={false}
          submitBehavior="submit"
          onSubmitEditing={onSubmit}
        />
      </View>

      <View className="border-border mt-4 border-t" />
      <View
        className="flex-row gap-3 px-4 pt-4"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <View className="flex-1">
          <Button variant="ghost" className="w-full" onPress={onClose}>
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button className="w-full" loading={isSaving} onPress={onSubmit}>
            Save
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}
