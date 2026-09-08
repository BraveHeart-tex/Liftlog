import { useDrizzle } from '@/src/providers/database-provider';
import { captureMessage } from '@sentry/react-native';
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
  const [state, setState] = useState<UpdateState>(() =>
    coordinator.currentState()
  );
  const attemptCoordinator = useMemo(() => {
    const updater = LiftlogUpdater;

    return exclusionCoordinator && updater
      ? createUpdateAttemptCoordinator({
          createAttemptId: generateUuid,
          begin: request => exclusionCoordinator.begin(request),
          permission: () => updater.getInstallPermissionAsync(),
          openPermissionSettings: () => updater.openInstallPermissionSettings(),
          download: (url, filePath, onProgress) => {
            const fileUri = filePath.startsWith('file://')
              ? filePath
              : `file://${filePath}`;
            const download = createDownloadResumable(
              url,
              fileUri,
              {},
              progress =>
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
          cancel: attemptId => exclusionCoordinator.cancel(attemptId),
          interrupt: async attemptId => {
            const native = await updater.interruptAsync(attemptId);
            applicationUpdateExclusion.reconcile(native.updateExcluded);

            return native;
          },
          getState: () => updater.getStateAsync(),
          reconcile: () => exclusionCoordinator.hydrate(),
          reportUnexpected: (stage, errorCode) => {
            captureMessage('UPDATE_ATTEMPT_FAILED', {
              level: 'error',
              extra: { stage, errorCode, androidApiLevel: Platform.Version }
            });
          }
        })
      : undefined;
  }, [exclusionCoordinator]);
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

    void exclusionCoordinator!
      .hydrate()
      .then(() => attemptCoordinator?.reconcile())
      .catch(error => {
        applicationUpdateExclusion.hydrate(true);
        console.error('Failed to reconcile application update state', error);
      })
      .finally(() => {
        if (mounted) {
          setIsExclusionHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [attemptCoordinator, exclusionCoordinator]);
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
        void attemptCoordinator.foregrounded();
        automaticSchedulerRef.current.foregrounded();
      } else {
        void attemptCoordinator.backgrounded();
      }
    });

    return () => subscription.remove();
  }, [attemptCoordinator]);
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
