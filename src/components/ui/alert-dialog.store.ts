import { create } from 'zustand';

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface ShowDialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
}

export interface DialogRequest {
  id: number;
  kind: 'confirm' | 'show';
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive: boolean;
  resolve: (confirmed: boolean) => void;
}

interface DialogState {
  request: DialogRequest | null;
  present: (request: DialogRequest) => void;
}

let nextDialogId = 1;

export const useAlertDialogStore = create<DialogState>((set, get) => ({
  request: null,
  present: request => {
    const currentRequest = get().request;

    if (currentRequest) {
      set({ request: null });
      currentRequest.resolve(false);
    }

    set({ request });
  }
}));

export function resolveDialog(dialogId: number, confirmed: boolean) {
  const currentRequest = useAlertDialogStore.getState().request;

  if (!currentRequest || currentRequest.id !== dialogId) {
    return;
  }

  setDialogRequest(null);
  currentRequest.resolve(confirmed);
}

export function dismissDialog() {
  const currentRequest = useAlertDialogStore.getState().request;

  if (currentRequest) {
    resolveDialog(currentRequest.id, false);
  }
}

export function confirmDialog(options: ConfirmDialogOptions) {
  return new Promise<boolean>(resolve => {
    useAlertDialogStore.getState().present({
      id: nextDialogId++,
      kind: 'confirm',
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel ?? 'Confirm',
      cancelLabel: options.cancelLabel ?? 'Cancel',
      destructive: options.destructive ?? false,
      resolve
    });
  });
}

export function showDialog(options: ShowDialogOptions) {
  return new Promise<void>(resolve => {
    useAlertDialogStore.getState().present({
      id: nextDialogId++,
      kind: 'show',
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel ?? 'OK',
      destructive: false,
      resolve: () => resolve()
    });
  });
}

function setDialogRequest(request: DialogRequest | null) {
  useAlertDialogStore.setState({ request });
}
