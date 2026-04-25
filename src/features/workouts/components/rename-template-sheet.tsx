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
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RenameTemplateSheetProps {
  isOpen: boolean;
  templateId?: string;
  initialName: string;
  onClose: () => void;
  onSubmit: (templateId: string, name: string) => boolean;
}

type BottomSheetInputRef = ComponentRef<typeof BottomSheetInput>;

export function RenameTemplateSheet({
  isOpen,
  templateId,
  initialName,
  onClose,
  onSubmit
}: RenameTemplateSheetProps) {
  const insets = useSafeAreaInsets();
  const templateInputRef = useRef<BottomSheetInputRef>(null);
  const isSavingRef = useRef(false);
  const [templateName, setTemplateName] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTemplateName(initialName);
    setError(undefined);
  }, [initialName, isOpen]);

  const handleClose = () => {
    Keyboard.dismiss();
    isSavingRef.current = false;
    setTemplateName(initialName);
    setError(undefined);
    setIsSaving(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!templateId || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setError(undefined);

    try {
      const didRename = onSubmit(templateId, templateName);

      if (!didRename) {
        setError('Could not rename template. Try again.');
        isSavingRef.current = false;
        setIsSaving(false);

        return;
      }
    } catch (submitError) {
      console.error('Failed to rename template', submitError);
      setError('Could not rename template. Try again.');
      isSavingRef.current = false;
      setIsSaving(false);

      return;
    }

    handleClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
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
        <Button variant="ghost" size="icon" onPress={handleClose}>
          <Icon icon={XIcon} size={20} className="text-foreground" />
        </Button>
      </BottomSheetHeader>

      <View className="px-4 pt-4">
        <BottomSheetInput
          ref={templateInputRef}
          label="Template name"
          value={templateName}
          onChangeText={nextName => {
            setTemplateName(nextName);
            setError(undefined);
          }}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          maxLength={80}
          error={error}
          blurOnSubmit={false}
          submitBehavior="submit"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <View className="border-border mt-4 border-t" />
      <View
        className="flex-row gap-3 px-4 pt-4"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <View className="flex-1">
          <Button variant="ghost" className="w-full" onPress={handleClose}>
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button className="w-full" loading={isSaving} onPress={handleSubmit}>
            Save
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}
