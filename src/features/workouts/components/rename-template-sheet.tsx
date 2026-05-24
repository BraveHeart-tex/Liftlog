import { RenameSheet } from '@/src/components/ui/rename-sheet';

interface RenameTemplateSheetProps {
  isOpen: boolean;
  templateId?: string;
  initialName: string;
  onClose: () => void;
  onSubmit: (templateId: string, name: string) => boolean;
}

export function RenameTemplateSheet({
  isOpen,
  templateId,
  initialName,
  onClose,
  onSubmit
}: RenameTemplateSheetProps) {
  const handleSubmit = (name: string) => {
    if (!templateId || !onSubmit(templateId, name)) {
      return 'Could not rename template. Try again.';
    }

    return undefined;
  };

  return (
    <RenameSheet
      isOpen={isOpen}
      title="Rename template"
      description="Update the name shown on your workout start screen."
      inputLabel="Template name"
      initialName={initialName}
      requiredMessage="Template name is required."
      fallbackErrorMessage="Could not rename template. Try again."
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
}
