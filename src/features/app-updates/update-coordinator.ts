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
    dismissedVersionCode: cache?.dismissedVersionCode,
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
    release,
    dismissedVersionCode: cache.dismissedVersionCode
  };
}

function quietState(
  installed: InstalledBuild,
  cache?: UpdateCache
): UpdateState {
  if (cache?.lastSuccessfulCheckAt === undefined) {
    return { status: 'idle', installedVersion: installed.versionName };
  }

  return successState(installed, cache);
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
    const lastAutomaticCheckAt =
      cache?.lastAutomaticCheckAt ?? cache?.lastSuccessfulCheckAt;
    const elapsed =
      lastAutomaticCheckAt === undefined
        ? undefined
        : now - lastAutomaticCheckAt;

    if (
      kind === 'automatic' &&
      elapsed !== undefined &&
      elapsed >= 0 &&
      elapsed < CHECK_INTERVAL_MS
    ) {
      return quietState(installed, cache);
    }

    const attemptedCache =
      kind === 'automatic' ? { ...cache, lastAutomaticCheckAt: now } : cache;

    if (kind === 'automatic') {
      dependencies.persistence.write(attemptedCache!);
    }

    try {
      const response = await dependencies.github.getLatestRelease(cache?.etag);

      if (response.status === 304) {
        const nextCache: UpdateCache = {
          ...attemptedCache,
          lastSuccessfulCheckAt: now
        };
        dependencies.persistence.write(nextCache);

        return successState(installed, nextCache);
      }

      if (!('release' in response)) {
        const isRateLimited =
          ('rateLimited' in response && response.rateLimited) ||
          response.status === 429;

        if (!isRateLimited && kind === 'manual') {
          dependencies.reportDiagnostic?.({
            code: 'UPDATE_CHECK_FAILED',
            stage: 'release_discovery',
            androidApiLevel: dependencies.androidApiLevel ?? 'unknown',
            httpStatusClass: `${Math.floor(response.status / 100)}xx`
          });
        }

        return kind === 'automatic'
          ? quietState(installed, cache)
          : errorState(
              installed,
              isRateLimited ? 'rate_limited' : 'check_failed',
              cache
            );
      }

      const manifest = await dependencies.github.getManifest(response.release);
      const available = resolveUpdateRelease(response.release, manifest);
      const nextCache: UpdateCache = {
        ...attemptedCache,
        etag: response.etag,
        lastSuccessfulCheckAt: now,
        release: available
      };
      dependencies.persistence.write(nextCache);

      return successState(installed, nextCache);
    } catch (error) {
      if (error instanceof UpdateNetworkError || error instanceof TypeError) {
        return kind === 'automatic'
          ? quietState(installed, cache)
          : errorState(installed, 'offline', cache);
      }

      const malformed = error instanceof UpdateManifestError;

      if (kind === 'manual') {
        dependencies.reportDiagnostic?.({
          code: malformed ? 'UPDATE_MANIFEST_INVALID' : 'UPDATE_CHECK_FAILED',
          stage: malformed ? 'manifest_validation' : 'release_discovery',
          androidApiLevel: dependencies.androidApiLevel ?? 'unknown',
          manifestSchema: malformed ? 1 : undefined
        });
      }

      return kind === 'automatic'
        ? quietState(installed, cache)
        : errorState(
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

      return quietState(installed, cache);
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
        ...cache,
        dismissedVersionCode: versionCode
      });
    }
  };
}
