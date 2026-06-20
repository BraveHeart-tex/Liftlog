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
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RenameSheetProps {
  isOpen: boolean;
  title: string;
  description: string;
  inputLabel: string;
  initialName: string;
  requiredMessage: string;
  fallbackErrorMessage: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (name: string) => string | undefined;
}

export function RenameSheet({
  isOpen,
  title,
  description,
  inputLabel,
  initialName,
  requiredMessage,
  fallbackErrorMessage,
  submitLabel = 'Save',
  onClose,
  onSubmit
}: RenameSheetProps) {
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
      <RenameSheetContent
        isOpen={isOpen}
        title={title}
        description={description}
        inputLabel={inputLabel}
        initialName={initialName}
        requiredMessage={requiredMessage}
        fallbackErrorMessage={fallbackErrorMessage}
        submitLabel={submitLabel}
        onClose={handleClose}
        onSubmit={onSubmit}
      />
    </BottomSheet>
  );
}

const RenameSheetContent = memo(function RenameSheetContent({
  isOpen,
  title,
  description,
  inputLabel,
  initialName,
  requiredMessage,
  fallbackErrorMessage,
  submitLabel = 'Save',
  onClose,
  onSubmit
}: RenameSheetProps) {
  const insets = useSafeAreaInsets();
  const isSavingRef = useRef(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(initialName);
    setError(undefined);
    setIsSaving(false);
    isSavingRef.current = false;
  }, [initialName, isOpen]);

  const handleClose = () => {
    isSavingRef.current = false;
    setName(initialName);
    setError(undefined);
    setIsSaving(false);
    onClose();
  };

  const handleSubmit = () => {
    if (isSavingRef.current) {
      return;
    }

    const nextName = name.trim();

    if (!nextName) {
      setError(requiredMessage);

      return;
    }

    if (nextName === initialName.trim()) {
      handleClose();

      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setError(undefined);

    try {
      const submitError = onSubmit(nextName);

      if (submitError) {
        setError(submitError);
        isSavingRef.current = false;
        setIsSaving(false);

        return;
      }
    } catch (submitError) {
      console.error(fallbackErrorMessage, submitError);
      setError(fallbackErrorMessage);
      isSavingRef.current = false;
      setIsSaving(false);

      return;
    }

    handleClose();
  };

  return (
    <>
      <BottomSheetHeader className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <BottomSheetTitle>{title}</BottomSheetTitle>
          <BottomSheetDescription>{description}</BottomSheetDescription>
        </View>
        <Button
          variant="secondary"
          size="icon"
          onPress={handleClose}
          accessibilityLabel="Close rename sheet"
        >
          <Icon icon={XIcon} size="lg" tone="foreground" />
        </Button>
      </BottomSheetHeader>

      <View className="px-4 pt-4">
        <BottomSheetInput
          label={inputLabel}
          value={name}
          onChangeText={nextName => {
            setName(nextName);
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
          <Button
            className="w-full"
            loading={isSaving}
            onPress={handleSubmit}
            disabled={name.trim().length === 0}
          >
            {submitLabel}
          </Button>
        </View>
      </View>
    </>
  );
});
