import type { InstallationStatus } from '@/modules/liftlog-updater/src';
import type {
  AppUpdateSnapshot,
  AppUpdateState,
  AvailableUpdate
} from '@/src/features/app-updates/app-update.types';
import { create } from 'zustand';

interface AppUpdateStore extends AppUpdateSnapshot {
  setState: (
    state: AppUpdateState,
    update?: Partial<AppUpdateSnapshot>
  ) => void;
  setAvailableUpdate: (availableUpdate: AvailableUpdate | null) => void;
  setProgress: (bytesDownloaded: number, totalBytes: number | null) => void;
  setInstallationStatus: (installationStatus: InstallationStatus) => void;
  reset: () => void;
}

const initialState: AppUpdateSnapshot = {
  state: 'idle',
  availableUpdate: null,
  bytesDownloaded: 0,
  totalBytes: null,
  errorCode: null,
  errorMessage: null,
  installationStatus: null
};

let updateExclusionHeld = false;

/** Synchronous process-wide guard shared by update and workout creation flows. */
export function acquireUpdateExclusion(): boolean {
  if (updateExclusionHeld) {
    return false;
  }

  updateExclusionHeld = true;

  return true;
}

export function releaseUpdateExclusion(): void {
  updateExclusionHeld = false;
}

export function isUpdateInProgress(): boolean {
  return updateExclusionHeld;
}

export const useAppUpdateStore = create<AppUpdateStore>(set => ({
  ...initialState,
  setState: (state, update = {}) => set({ ...update, state }),
  setAvailableUpdate: availableUpdate => set({ availableUpdate }),
  setProgress: (bytesDownloaded, totalBytes) =>
    set({ bytesDownloaded, totalBytes }),
  setInstallationStatus: installationStatus => set({ installationStatus }),
  reset: () => set(initialState)
}));
