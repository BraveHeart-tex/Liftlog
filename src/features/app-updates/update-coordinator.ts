import { resolveUpdateRelease, UpdateManifestError } from './update-manifest';
import type {
  GitHubRelease,
  InstalledBuild,
  UpdateCache,
  UpdateDiagnostic,
  UpdateErrorCode,
  UpdateState
} from './update.types';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1_000;

export class UpdateNetworkError extends Error {}

type LatestReleaseResponse =
  | { status: 200; release: GitHubRelease; etag?: string }
  | { status: 304 }
  | { status: number; rateLimited?: boolean };

export interface UpdateGitHubClient {
  getLatestRelease(etag?: string): Promise<LatestReleaseResponse>;
  getManifest(release: GitHubRelease): Promise<unknown>;
}

export interface UpdatePersistence {
  read(): UpdateCache | undefined;
  write(cache: UpdateCache): void;
}

interface UpdateCoordinatorDependencies {
  github: UpdateGitHubClient;
  persistence: UpdatePersistence;
  installedBuild(): InstalledBuild;
  now(): number;
  androidApiLevel?: number | string;
  reportDiagnostic?(diagnostic: UpdateDiagnostic): void;
}

function errorState(
  installed: InstalledBuild,
  code: UpdateErrorCode,
  cache?: UpdateCache
): UpdateState {
  return {
    status: 'error',
    installedVersion: installed.versionName,
    lastSuccessfulCheckAt: cache?.lastSuccessfulCheckAt,
    release:
      cache?.release && cache.release.versionCode > installed.versionCode
        ? cache.release
        : undefined,
    error: { code }
  };
}

function successState(
  installed: InstalledBuild,
  cache: UpdateCache
): UpdateState {
  const release =
    cache.release && cache.release.versionCode > installed.versionCode
      ? cache.release
      : undefined;

  return {
    status: release ? 'available' : 'up_to_date',
    installedVersion: installed.versionName,
    lastSuccessfulCheckAt: cache.lastSuccessfulCheckAt,
    release
  };
}

export function createUpdateCoordinator(
  dependencies: UpdateCoordinatorDependencies
) {
  let activeCheck: Promise<UpdateState> | undefined;

  const runCheck = async (
    kind: 'automatic' | 'manual'
  ): Promise<UpdateState> => {
    const installed = dependencies.installedBuild();
    const cache = dependencies.persistence.read();
    const now = dependencies.now();
    const elapsed = cache ? now - cache.lastSuccessfulCheckAt : undefined;

    if (
      kind === 'automatic' &&
      elapsed !== undefined &&
      elapsed >= 0 &&
      elapsed < CHECK_INTERVAL_MS
    ) {
      return {
        status: 'idle',
        installedVersion: installed.versionName,
        lastSuccessfulCheckAt: cache?.lastSuccessfulCheckAt,
        release: cache?.release
      };
    }

    try {
      const response = await dependencies.github.getLatestRelease(cache?.etag);

      if (response.status === 304) {
        const nextCache: UpdateCache = {
          ...cache,
          lastSuccessfulCheckAt: now
        };
        dependencies.persistence.write(nextCache);

        return successState(installed, nextCache);
      }

      if (!('release' in response)) {
        const isRateLimited =
          ('rateLimited' in response && response.rateLimited) ||
          response.status === 429;

        if (!isRateLimited) {
          dependencies.reportDiagnostic?.({
            code: 'UPDATE_CHECK_FAILED',
            stage: 'release_discovery',
            androidApiLevel: dependencies.androidApiLevel ?? 'unknown',
            httpStatusClass: `${Math.floor(response.status / 100)}xx`
          });
        }

        return errorState(
          installed,
          isRateLimited ? 'rate_limited' : 'check_failed',
          cache
        );
      }

      const manifest = await dependencies.github.getManifest(response.release);
      const available = resolveUpdateRelease(response.release, manifest);
      const nextCache: UpdateCache = {
        ...cache,
        etag: response.etag,
        lastSuccessfulCheckAt: now,
        release: available
      };
      dependencies.persistence.write(nextCache);

      return successState(installed, nextCache);
    } catch (error) {
      if (error instanceof UpdateNetworkError || error instanceof TypeError) {
        return errorState(installed, 'offline', cache);
      }

      const malformed = error instanceof UpdateManifestError;

      dependencies.reportDiagnostic?.({
        code: malformed ? 'UPDATE_MANIFEST_INVALID' : 'UPDATE_CHECK_FAILED',
        stage: malformed ? 'manifest_validation' : 'release_discovery',
        androidApiLevel: dependencies.androidApiLevel ?? 'unknown',
        manifestSchema: malformed ? 1 : undefined
      });

      return errorState(
        installed,
        malformed ? 'malformed_release' : 'check_failed',
        cache
      );
    }
  };

  return {
    currentState(): UpdateState {
      const installed = dependencies.installedBuild();
      const cache = dependencies.persistence.read();

      return cache
        ? successState(installed, cache)
        : { status: 'idle', installedVersion: installed.versionName };
    },
    check(kind: 'automatic' | 'manual'): Promise<UpdateState> {
      if (activeCheck) {
        return activeCheck;
      }

      activeCheck = runCheck(kind).finally(() => {
        activeCheck = undefined;
      });

      return activeCheck;
    },
    dismiss(versionCode: number): void {
      const cache = dependencies.persistence.read();

      dependencies.persistence.write({
        lastSuccessfulCheckAt: cache?.lastSuccessfulCheckAt ?? 0,
        ...cache,
        dismissedVersionCode: versionCode
      });
    }
  };
}
