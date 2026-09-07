import { useDrizzle } from '@/src/providers/database-provider';
import { captureMessage } from '@sentry/react-native';
import Constants from 'expo-constants';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { Platform } from 'react-native';
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
import type {
  BeginAttemptRequest,
  NativeUpdateState
} from '@/modules/liftlog-updater/src/types';
import type { ExclusionResult } from './update-exclusion';

if (Platform.OS !== 'android') {
  applicationUpdateExclusion.hydrate(false);
}

interface UpdateContextValue {
  state: UpdateState;
  checkForUpdates(): Promise<void>;
  beginUpdate(request: BeginAttemptRequest): Promise<ExclusionResult>;
  commitUpdate(attemptId: string): Promise<ExclusionResult>;
  cancelUpdate(attemptId: string): Promise<NativeUpdateState>;
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
          versionName: Constants.nativeAppVersion ?? 'Unknown',
          versionCode: Number(Constants.nativeBuildVersion ?? 0)
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
  }, [exclusionCoordinator]);
  const checkForUpdates = useCallback(async () => {
    setState(current => ({ ...current, status: 'checking', error: undefined }));
    setState(await coordinator.check('manual'));
  }, [coordinator]);
  const requireExclusionCoordinator = useCallback(() => {
    if (!exclusionCoordinator) {
      throw new Error('Application updates are unavailable on this platform.');
    }

    return exclusionCoordinator;
  }, [exclusionCoordinator]);
  const beginUpdate = useCallback(
    (request: BeginAttemptRequest) =>
      requireExclusionCoordinator().begin(request),
    [requireExclusionCoordinator]
  );
  const commitUpdate = useCallback(
    (attemptId: string) => requireExclusionCoordinator().commit(attemptId),
    [requireExclusionCoordinator]
  );
  const cancelUpdate = useCallback(
    (attemptId: string) => requireExclusionCoordinator().cancel(attemptId),
    [requireExclusionCoordinator]
  );
  const value = useMemo(
    () => ({ state, checkForUpdates, beginUpdate, commitUpdate, cancelUpdate }),
    [beginUpdate, cancelUpdate, checkForUpdates, commitUpdate, state]
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
