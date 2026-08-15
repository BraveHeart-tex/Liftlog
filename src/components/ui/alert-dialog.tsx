import {
  confirmDialog,
  dismissDialog,
  resolveDialog,
  showDialog,
  useAlertDialogStore,
  type DialogRequest
} from '@/src/components/ui/alert-dialog.store';
import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetSafeFooter,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { useCallback, useEffect, useRef, useState } from 'react';

export type {
  ConfirmDialogOptions,
  ShowDialogOptions
} from '@/src/components/ui/alert-dialog.store';

export { confirmDialog, dismissDialog, showDialog };

interface DialogViewProps {
  request: DialogRequest;
  isOpen: boolean;
  onExit: (dialogId: number) => void;
}

function DialogView({ request, isOpen, onExit }: DialogViewProps) {
  const hasResolvedRef = useRef(false);

  useEffect(() => {
    hasResolvedRef.current = false;
  }, [request.id]);

  const resolve = useCallback(
    (value: boolean) => {
      if (hasResolvedRef.current) {
        return;
      }

      hasResolvedRef.current = true;
      resolveDialog(request.id, value);
    },
    [request.id]
  );

  const handleDismiss = useCallback(() => {
    resolve(false);
    onExit(request.id);
  }, [onExit, request.id, resolve]);
  const handleCancel = useCallback(() => resolve(false), [resolve]);
  const handleConfirm = useCallback(() => resolve(true), [resolve]);

  const interactive = isOpen && !hasResolvedRef.current;

  return (
    <BottomSheet isOpen={isOpen} onClose={handleDismiss} enableDynamicSizing>
      <BottomSheetHeader>
        <BottomSheetTitle>{request.title}</BottomSheetTitle>
        {request.message ? (
          <BottomSheetDescription>{request.message}</BottomSheetDescription>
        ) : null}
      </BottomSheetHeader>
      <BottomSheetSafeFooter className="justify-end">
        {request.kind === 'confirm' ? (
          <Button
            variant="secondary"
            size="sm"
            accessibilityLabel={request.cancelLabel}
            disabled={!interactive}
            onPress={handleCancel}
          >
            {request.cancelLabel}
          </Button>
        ) : null}
        <Button
          variant={request.destructive ? 'destructive' : 'primary'}
          size="sm"
          accessibilityLabel={request.confirmLabel}
          disabled={!interactive}
          onPress={handleConfirm}
        >
          {request.confirmLabel}
        </Button>
      </BottomSheetSafeFooter>
    </BottomSheet>
  );
}

export function AlertDialogHost() {
  const request = useAlertDialogStore(state => state.request);
  const [renderedDialog, setRenderedDialog] = useState<{
    request: DialogRequest;
    isOpen: boolean;
  } | null>(null);

  const handleExit = useCallback((dialogId: number) => {
    setRenderedDialog(currentDialog =>
      currentDialog?.request.id === dialogId ? null : currentDialog
    );
  }, []);

  useEffect(() => {
    setRenderedDialog(currentDialog => {
      if (request) {
        if (currentDialog?.request.id === request.id && currentDialog.isOpen) {
          return currentDialog;
        }

        return { request, isOpen: true };
      }

      return currentDialog
        ? { ...currentDialog, isOpen: false }
        : currentDialog;
    });
  }, [request]);

  if (!renderedDialog) {
    return null;
  }

  return (
    <DialogView
      key={renderedDialog.request.id}
      request={renderedDialog.request}
      isOpen={renderedDialog.isOpen}
      onExit={handleExit}
    />
  );
}
