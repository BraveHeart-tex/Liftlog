import { useDrizzle } from '@/src/providers/database-provider';
import { captureException, captureMessage } from '@sentry/react-native';
import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application';
import Constants from 'expo-constants';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { AppState, Platform } from 'react-native';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { createUpdateCoordinator } from './update-coordinator';
import { updateGitHubClient } from './update-github.client';
import { createUpdateRepository } from './update.repository';
import type { UpdateState } from './update.types';
import { LiftlogUpdater } from '@/modules/liftlog-updater/src';
import {
  applicationUpdateExclusion,
  createUpdateExclusionCoordinator
} from './update-exclusion';
import { hasActiveWorkout } from '@/src/features/workouts/shared/workout.repository';
import {
  createUpdateAttemptCoordinator,
  type UpdateAttemptState
} from './update-attempt-coordinator';
import { generateUuid } from '@/src/lib/utils/uuid.utils';
import { scheduleIdleTask } from '@/src/lib/utils/schedule-idle-task.utils';
import { createAutomaticUpdateScheduler } from './update-announcement';
import { createAppUpdateReporter } from './update-reporter';
import { createUpdateDiagnosticReporter } from './update-diagnostic-reporter';
import { createUpdateLifecycle } from './update-lifecycle';
import { showSnackbar } from '@/src/components/ui/snackbar';

if (Platform.OS !== 'android') {
  applicationUpdateExclusion.hydrate(false);
}

interface UpdateContextValue {
  state: UpdateState;
  attempt: UpdateAttemptState;
  checkForUpdates(): Promise<void>;
  dismissUpdate(): void;
  startUpdate(): Promise<void>;
  resumeUpdate(): Promise<void>;
  cancelUpdate(): Promise<void>;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

export function UpdateProvider({ children }: PropsWithChildren) {
  const db = useDrizzle();
  const [isExclusionHydrated, setIsExclusionHydrated] = useState(
    Platform.OS !== 'android'
  );
  const repository = useMemo(() => createUpdateRepository(db), [db]);
  const exclusionCoordinator = useMemo(
    () =>
      Platform.OS === 'android' && LiftlogUpdater
        ? createUpdateExclusionCoordinator({
            latch: applicationUpdateExclusion,
            nativeUpdater: LiftlogUpdater,
            hasActiveWorkout: () => hasActiveWorkout(db)
          })
        : undefined,
    [db]
  );
  const coordinator = useMemo(
    () =>
      createUpdateCoordinator({
        github: updateGitHubClient,
        persistence: repository,
        installedBuild: () => ({
          versionName:
            nativeApplicationVersion ??
            Constants.expoConfig?.version ??
            'Unknown',
          versionCode: Number(
            nativeBuildVersion ??
              Constants.expoConfig?.android?.versionCode ??
              0
          )
        }),
        now: Date.now,
        androidApiLevel: Platform.Version,
        reportDiagnostic: diagnostic => {
          captureMessage(diagnostic.code, {
            level: 'error',
            extra: { ...diagnostic }
          });
        }
      }),
    [repository]
  );
  const diagnosticReporter = useMemo(() => {
    const updater = LiftlogUpdater;

    if (Platform.OS !== 'android' || !updater) {
      return undefined;
    }

    return createUpdateDiagnosticReporter({
      getPendingDiagnostics: () => updater.getPendingDiagnosticsAsync(),
      acknowledge: (attemptId, diagnosticId) =>
        updater.acknowledgeDiagnosticAsync({ attemptId, diagnosticId }),
      captureMessage,
      getInstalledBuildInfo: () => updater.getInstalledBuildInfoAsync(),
      androidApiLevel: Platform.Version,
      now: Date.now,
      consoleError: (message, error) => console.error(message, error)
    });
  }, []);
  const [state, setState] = useState<UpdateState>(() =>
    coordinator.currentState()
  );
  const appUpdateReporter = useMemo(() => {
    const updater = LiftlogUpdater;

    if (Platform.OS !== 'android' || !updater) {
      return undefined;
    }

    return createAppUpdateReporter({
      captureException,
      captureMessage,
      getInstalledBuildInfo: () => updater.getInstalledBuildInfoAsync(),
      getNativeState: () => updater.getStateAsync(),
      androidApiLevel: Platform.Version,
      consoleError: (message, error) => console.error(message, error)
    });
  }, []);
  const attemptCoordinator = useMemo(() => {
    const updater = LiftlogUpdater;

    if (!exclusionCoordinator || !updater) {
      return undefined;
    }

    return createUpdateAttemptCoordinator({
      createAttemptId: generateUuid,
      begin: request => exclusionCoordinator.begin(request),
      permission: () => updater.getInstallPermissionAsync(),
      openPermissionSettings: () => updater.openInstallPermissionSettings(),
      download: (url, filePath, onProgress) => {
        const fileUri = filePath.startsWith('file://')
          ? filePath
          : `file://${filePath}`;
        const download = createDownloadResumable(url, fileUri, {}, progress =>
          onProgress(
            progress.totalBytesWritten,
            progress.totalBytesExpectedToWrite
          )
        );

        return {
          promise: download.downloadAsync().then(result => {
            if (!result) {
              throw Object.assign(new Error('Download cancelled'), {
                code: 'UPDATER_CANCELLED'
              });
            }
          }),
          cancel: () => download.cancelAsync()
        };
      },
      verify: request => updater.verifyAndStageAsync(request),
      commit: attemptId => exclusionCoordinator.commit(attemptId),
      resumeConfirmation: attemptId =>
        updater.resumePendingConfirmationAsync(attemptId),
      cancel: attemptId => exclusionCoordinator.cancel(attemptId),
      interrupt: async attemptId => {
        const native = await updater.interruptAsync(attemptId);
        applicationUpdateExclusion.reconcile(native.updateExcluded);

        return native;
      },
      getState: () => updater.getStateAsync(),
      reconcile: () => exclusionCoordinator.hydrate(),
      reportUnexpected: appUpdateReporter!.reportUnexpected
    });
  }, [appUpdateReporter, exclusionCoordinator]);
  const [attempt, setAttempt] = useState<UpdateAttemptState>({
    status: 'idle'
  });
  const automaticScheduler = useMemo(
    () =>
      createAutomaticUpdateScheduler({
        schedule: scheduleIdleTask,
        check: async () => {
          setState(await coordinator.check('automatic'));
        }
      }),
    [coordinator]
  );
  const automaticSchedulerRef = useRef(automaticScheduler);

  automaticSchedulerRef.current = automaticScheduler;

  const updateLifecycle = useMemo(() => {
    const updater = LiftlogUpdater;

    if (!attemptCoordinator || !appUpdateReporter || !updater) {
      return undefined;
    }

    return createUpdateLifecycle({
      coordinator: attemptCoordinator,
      cancelCompletionNotification: () =>
        updater.cancelCompletionNotificationAsync(),
      getCompletion: () => updater.getCompletionAsync(),
      acknowledgeCompletion: attemptId =>
        updater.acknowledgeCompletionAsync(attemptId),
      showCompletion: completion => {
        showSnackbar({
          key: 'app-update-complete',
          message: `LiftLog updated to ${completion.installedVersionName}.`,
          variant: 'success'
        });
      },
      reportCompletion: completion =>
        appUpdateReporter.reportCompletion(completion),
      drainDiagnostics: () =>
        diagnosticReporter?.drainOne() ?? Promise.resolve(),
      reportReconciliationFailure:
        appUpdateReporter.reportReconciliationFailure,
      keepExclusion: () => applicationUpdateExclusion.hydrate(true)
    });
  }, [appUpdateReporter, attemptCoordinator, diagnosticReporter]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!LiftlogUpdater) {
      applicationUpdateExclusion.hydrate(false);
      setIsExclusionHydrated(true);

      return;
    }

    let mounted = true;

    void updateLifecycle!.started().finally(() => {
      if (mounted) {
        setIsExclusionHydrated(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [updateLifecycle]);
  useEffect(() => {
    if (!attemptCoordinator) {
      return;
    }

    setAttempt(attemptCoordinator.getState());

    return attemptCoordinator.subscribe(setAttempt);
  }, [attemptCoordinator]);
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    automaticScheduler.started();

    return () => automaticScheduler.dispose();
  }, [automaticScheduler]);
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!attemptCoordinator) {
      const subscription = AppState.addEventListener('change', nextState => {
        if (nextState === 'active') {
          automaticSchedulerRef.current.foregrounded();
        }
      });

      return () => subscription.remove();
    }

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        void updateLifecycle!.foregrounded();
        automaticSchedulerRef.current.foregrounded();
      } else {
        void attemptCoordinator.backgrounded();
      }
    });

    return () => subscription.remove();
  }, [attemptCoordinator, updateLifecycle]);
  const checkForUpdates = useCallback(async () => {
    setState(current => ({ ...current, status: 'checking', error: undefined }));
    setState(await coordinator.check('manual'));
  }, [coordinator]);
  const dismissUpdate = useCallback(() => {
    if (state.release) {
      coordinator.dismiss(state.release.versionCode);
      setState(coordinator.currentState());
    }
  }, [coordinator, state.release]);
  const requireAttemptCoordinator = useCallback(() => {
    if (!attemptCoordinator) {
      throw new Error('Application updates are unavailable on this platform.');
    }

    return attemptCoordinator;
  }, [attemptCoordinator]);
  const startUpdate = useCallback(async () => {
    if (state.release) {
      await requireAttemptCoordinator().start(state.release);
    }
  }, [requireAttemptCoordinator, state.release]);
  const resumeUpdate = useCallback(async () => {
    const active = requireAttemptCoordinator();

    if (active.getState().status === 'permission') {
      await active.resumePermission();
    } else if (active.getState().status === 'installer') {
      await active.resumeConfirmation();
    } else if (state.release) {
      await active.start(state.release);
    }
  }, [requireAttemptCoordinator, state.release]);
  const cancelUpdate = useCallback(
    () => requireAttemptCoordinator().cancel(),
    [requireAttemptCoordinator]
  );
  const value = useMemo(
    () => ({
      state,
      attempt,
      checkForUpdates,
      dismissUpdate,
      startUpdate,
      resumeUpdate,
      cancelUpdate
    }),
    [
      attempt,
      cancelUpdate,
      checkForUpdates,
      dismissUpdate,
      resumeUpdate,
      startUpdate,
      state
    ]
  );

  return isExclusionHydrated ? (
    <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>
  ) : null;
}

export function useAppUpdates() {
  const value = useContext(UpdateContext);

  if (!value) {
    throw new Error('useAppUpdates must be used within UpdateProvider');
  }

  return value;
}
