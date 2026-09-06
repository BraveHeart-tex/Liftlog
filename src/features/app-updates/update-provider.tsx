import { useDrizzle } from '@/src/providers/database-provider';
import { captureMessage } from '@sentry/react-native';
import Constants from 'expo-constants';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';
import { Platform } from 'react-native';
import { createUpdateCoordinator } from './update-coordinator';
import { updateGitHubClient } from './update-github.client';
import { createUpdateRepository } from './update.repository';
import type { UpdateState } from './update.types';

interface UpdateContextValue {
  state: UpdateState;
  checkForUpdates(): Promise<void>;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

export function UpdateProvider({ children }: PropsWithChildren) {
  const db = useDrizzle();
  const repository = useMemo(() => createUpdateRepository(db), [db]);
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
  const checkForUpdates = useCallback(async () => {
    setState(current => ({ ...current, status: 'checking', error: undefined }));
    setState(await coordinator.check('manual'));
  }, [coordinator]);
  const value = useMemo(
    () => ({ state, checkForUpdates }),
    [checkForUpdates, state]
  );

  return (
    <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>
  );
}

export function useAppUpdates() {
  const value = useContext(UpdateContext);

  if (!value) {
    throw new Error('useAppUpdates must be used within UpdateProvider');
  }

  return value;
}
