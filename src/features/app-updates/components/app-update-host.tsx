import { useAlertDialogStore } from '@/src/components/ui/alert-dialog.store';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { useDrizzle } from '@/src/providers/database-provider';
import {
  checkForUpdate,
  cancelUpdate,
  dismissUpdate,
  downloadAndInstallUpdate,
  reconcileInstallation
} from '@/src/features/app-updates/app-update.service';
import { useAppUpdateStore } from '@/src/features/app-updates/app-update.store';
import { AppUpdateDialog } from '@/src/features/app-updates/components/app-update-dialog';
import { scheduleIdleTask } from '@/src/lib/utils/schedule-idle-task.utils';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

export function AppUpdateHost() {
  if (Platform.OS !== 'android') {
    return null;
  }

  return <AndroidAppUpdateHost />;
}

function AndroidAppUpdateHost() {
  const db = useDrizzle();
  const update = useAppUpdateStore(state => state.availableUpdate);
  const state = useAppUpdateStore(state => state.state);
  const dialogRequest = useAlertDialogStore(state => state.request);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const promptedVersion = useRef<number | null>(null);

  useEffect(() => {
    void reconcileInstallation().catch(error =>
      console.error('Failed to reconcile app installation', error)
    );

    const check = () => {
      if (
        [
          'downloading',
          'verifying',
          'installing',
          'awaiting_confirmation'
        ].includes(useAppUpdateStore.getState().state)
      ) {
        return () => undefined;
      }

      const cancel = scheduleIdleTask(() => {
        void checkForUpdate(db).catch(() => undefined);
      });

      return cancel;
    };

    const cancelInitial = check();
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        check();
      }
    });

    return () => {
      cancelInitial();
      subscription.remove();
    };
  }, [db]);

  useEffect(() => {
    if (
      state === 'available' &&
      update &&
      promptedVersion.current !== update.manifest.versionCode &&
      !dialogRequest
    ) {
      promptedVersion.current = update.manifest.versionCode;
      setIsDialogOpen(true);
    }
  }, [dialogRequest, state, update]);

  if (!update) {
    return null;
  }

  const handleLater = () => {
    setIsDialogOpen(false);
    dismissUpdate(db, update.manifest.versionCode);
  };

  const handleUpdate = () => {
    setIsDialogOpen(false);
    void downloadAndInstallUpdate(db, update).catch(error => {
      if (error?.code === 'permission_denied') {
        showSnackbar({
          message: 'Allow app installs in Android settings, then try again.',
          variant: 'warning'
        });
      } else if (error?.code !== 'cancelled') {
        showSnackbar({
          message: 'Update failed. Try again in Settings.',
          variant: 'danger'
        });
      }
    });
  };

  return (
    <AppUpdateDialog
      update={update}
      isOpen={isDialogOpen && state === 'available'}
      onLater={handleLater}
      onUpdate={handleUpdate}
    />
  );
}

export { cancelUpdate };
