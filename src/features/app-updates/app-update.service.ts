import type { DrizzleDb } from '@/src/db/client';
import {
  getDismissedUpdateVersion,
  getLastUpdateCheckAt,
  setDismissedUpdateVersion,
  setLastUpdateCheckAt
} from '@/src/features/app-updates/app-update.repository';
import {
  LiftlogUpdater,
  type LiftlogUpdaterModule
} from '@/modules/liftlog-updater/src';
import { Platform } from 'react-native';
import { Paths } from 'expo-file-system';
import {
  createDownloadResumable,
  deleteAsync,
  getInfoAsync,
  makeDirectoryAsync
} from 'expo-file-system/legacy';
import type {
  AppUpdateSnapshot,
  AvailableUpdate,
  GitHubRelease,
  GitHubReleaseAsset,
  UpdateManifest
} from '@/src/features/app-updates/app-update.types';
import { useAppUpdateStore } from '@/src/features/app-updates/app-update.store';

export const GITHUB_RELEASE_URL =
  'https://api.github.com/repos/BraveHeart-tex/Liftlog/releases/latest';

export const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const UPDATE_PACKAGE_NAME = 'com.borakaraca94.liftlog';

const UPDATE_CACHE_DIRECTORY = `${Paths.cache.uri}liftlog-updates/`;

type FetchLike = typeof fetch;
interface DownloadTask {
  downloadAsync: () => Promise<{ uri: string }>;
  cancelAsync: () => Promise<void>;
}

interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
}

let checkPromise: Promise<AvailableUpdate | null> | null = null;
let downloadTask: DownloadTask | null = null;
let operationToken = 0;

export class AppUpdateError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppUpdateError';
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function validateUpdateManifest(value: unknown): UpdateManifest {
  if (!value || typeof value !== 'object') {
    throw new AppUpdateError(
      'invalid_manifest',
      'Update manifest is not an object.'
    );
  }

  const manifest = value as Partial<UpdateManifest>;

  if (
    typeof manifest.versionName !== 'string' ||
    !manifest.versionName.trim() ||
    !isPositiveInteger(manifest.versionCode) ||
    typeof manifest.apkFilename !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*\.apk$/.test(manifest.apkFilename) ||
    typeof manifest.sha256 !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(manifest.sha256) ||
    !isPositiveInteger(manifest.sizeBytes) ||
    typeof manifest.releaseNotes !== 'string' ||
    (manifest.mandatory !== undefined &&
      typeof manifest.mandatory !== 'boolean')
  ) {
    throw new AppUpdateError(
      'invalid_manifest',
      'Update manifest fields are invalid.'
    );
  }

  return {
    versionName: manifest.versionName,
    versionCode: manifest.versionCode,
    apkFilename: manifest.apkFilename,
    sha256: manifest.sha256.toLowerCase(),
    sizeBytes: manifest.sizeBytes,
    releaseNotes: manifest.releaseNotes,
    ...(manifest.mandatory === undefined
      ? {}
      : { mandatory: manifest.mandatory })
  };
}

function assertResponse(response: Response, description: string): void {
  if (!response.ok) {
    throw new AppUpdateError(
      response.status === 403 || response.status === 429
        ? 'rate_limited'
        : 'network_error',
      `${description} failed (${response.status}).`
    );
  }
}

function findAsset(release: GitHubRelease, name: string): GitHubReleaseAsset {
  const asset = release.assets.find(candidate => candidate.name === name);

  if (!asset || typeof asset.browser_download_url !== 'string') {
    throw new AppUpdateError(
      'missing_asset',
      `Release asset ${name} is missing.`
    );
  }

  return asset;
}

export async function fetchAvailableUpdate(
  installedVersionCode: number,
  fetchImpl: FetchLike = fetch
): Promise<AvailableUpdate | null> {
  const releaseResponse = await fetchImpl(GITHUB_RELEASE_URL, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  assertResponse(releaseResponse, 'Latest release request');
  const release = (await releaseResponse.json()) as GitHubRelease;

  if (release.draft || release.prerelease || !Array.isArray(release.assets)) {
    return null;
  }

  const manifestAsset = findAsset(release, 'update.json');
  const apkManifestResponse = await fetchImpl(
    manifestAsset.browser_download_url
  );
  assertResponse(apkManifestResponse, 'Update manifest request');
  const manifest = validateUpdateManifest(await apkManifestResponse.json());
  const apkAsset = findAsset(release, manifest.apkFilename);

  if (apkAsset.size !== manifest.sizeBytes) {
    throw new AppUpdateError(
      'invalid_manifest',
      'Manifest APK size does not match its release asset.'
    );
  }

  if (manifest.versionCode <= installedVersionCode) {
    return null;
  }

  return {
    release,
    manifest,
    apkUrl: apkAsset.browser_download_url,
    apkSizeBytes: manifest.sizeBytes
  };
}

export function isUpdateCheckThrottled(
  lastCheckedAt: number | null,
  now = Date.now()
): boolean {
  return (
    lastCheckedAt !== null && now - lastCheckedAt < UPDATE_CHECK_INTERVAL_MS
  );
}

export async function checkForUpdate(
  db: DrizzleDb,
  options: { manual?: boolean; now?: number; fetchImpl?: FetchLike } = {}
): Promise<AvailableUpdate | null> {
  if (checkPromise) {
    return checkPromise;
  }

  const now = options.now ?? Date.now();

  if (
    !options.manual &&
    isUpdateCheckThrottled(getLastUpdateCheckAt(db), now)
  ) {
    return null;
  }

  const native = Platform.OS === 'android' ? requireUpdater() : null;
  checkPromise = (async () => {
    if (!native) {
      return null;
    }

    const installed = await native.getInstalledBuildInfoAsync();
    // Record attempts as well as successes so foreground checks cannot hammer
    // GitHub after a network or rate-limit failure.
    setLastUpdateCheckAt(db, now);
    const update = await fetchAvailableUpdate(
      installed.versionCode,
      options.fetchImpl
    );

    if (
      update &&
      getDismissedUpdateVersion(db) !== update.manifest.versionCode
    ) {
      useAppUpdateStore.getState().setAvailableUpdate(update);
      useAppUpdateStore.getState().setState('available');

      return update;
    }

    return null;
  })().finally(() => {
    checkPromise = null;
  });

  return checkPromise;
}

function requireUpdater(): LiftlogUpdaterModule {
  // The binding itself is platform-gated, so this is only reached on Android.
  const updater = LiftlogUpdater;

  if (!updater) {
    throw new AppUpdateError(
      'native_unavailable',
      'Updater module is unavailable.'
    );
  }

  return updater;
}

export function dismissUpdate(db: DrizzleDb, versionCode: number): void {
  setDismissedUpdateVersion(db, versionCode);
  useAppUpdateStore.getState().reset();
}

export async function cancelUpdate(): Promise<void> {
  operationToken++;
  await downloadTask?.cancelAsync();
  downloadTask = null;
  const native = Platform.OS === 'android' ? requireUpdater() : null;

  if (native) {
    await native.cancelInstallationAsync();
  }

  useAppUpdateStore.getState().setState('cancelled');
}

export async function downloadAndInstallUpdate(
  update: AvailableUpdate,
  onSnapshot?: (snapshot: AppUpdateSnapshot) => void
): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new AppUpdateError(
      'unsupported_platform',
      'Updates are Android-only.'
    );
  }

  const native = requireUpdater();
  const token = ++operationToken;
  const setState = (state: AppUpdateSnapshot['state'], extra = {}) => {
    if (token !== operationToken) {
      throw new AppUpdateError('cancelled', 'Update was cancelled.');
    }

    useAppUpdateStore.getState().setState(state, extra);
    onSnapshot?.(useAppUpdateStore.getState());
  };

  const permission = await native.getInstallPermissionStatusAsync();

  if (!permission.canRequestPackageInstalls) {
    setState('permission_required');

    return;
  }

  const fileUri = `${UPDATE_CACHE_DIRECTORY}${update.manifest.apkFilename}`;
  await makeDirectoryAsync(UPDATE_CACHE_DIRECTORY, { intermediates: true });
  await deleteAsync(fileUri, { idempotent: true });
  setState('downloading', {
    bytesDownloaded: 0,
    totalBytes: update.apkSizeBytes
  });
  downloadTask = createDownloadResumable(
    update.apkUrl,
    fileUri,
    {},
    (progress: DownloadProgress) => {
      if (token !== operationToken) {
        return;
      }

      useAppUpdateStore
        .getState()
        .setProgress(
          progress.totalBytesWritten,
          progress.totalBytesExpectedToWrite > 0
            ? progress.totalBytesExpectedToWrite
            : update.apkSizeBytes
        );
      onSnapshot?.(useAppUpdateStore.getState());
    }
  ) as DownloadTask;
  let installerStarted = false;

  try {
    await downloadTask.downloadAsync();
    downloadTask = null;
    const info = await getInfoAsync(fileUri);

    if (!info.exists || info.size !== update.manifest.sizeBytes) {
      throw new AppUpdateError(
        'verification_failed',
        'Downloaded APK size does not match the manifest.'
      );
    }

    setState('verifying');
    await native.verifyApkAsync({
      fileUri,
      expectedSha256: update.manifest.sha256,
      expectedPackageName: UPDATE_PACKAGE_NAME,
      expectedVersionCode: update.manifest.versionCode
    });
    setState('installing');
    installerStarted = true;
    const status = await native.installVerifiedApkAsync();
    useAppUpdateStore.getState().setInstallationStatus(status);
    setState(
      status.state === 'pending_user_action'
        ? 'awaiting_confirmation'
        : 'installing'
    );
  } catch (error) {
    downloadTask = null;

    if (token !== operationToken) {
      return;
    }

    if (!installerStarted) {
      await deleteAsync(fileUri, { idempotent: true });
    }

    const code =
      error instanceof AppUpdateError
        ? error.code
        : ((error as { code?: string }).code ?? 'network_error');
    useAppUpdateStore.getState().setState('failed', {
      errorCode: code,
      errorMessage: error instanceof Error ? error.message : 'Update failed.'
    });

    throw error;
  }
}

export function reconcileInstallation(
  onSnapshot?: (snapshot: AppUpdateSnapshot) => void
): Promise<void> {
  if (Platform.OS !== 'android') {
    return Promise.resolve();
  }

  return requireUpdater()
    .getInstallationStatusAsync()
    .then(status => {
      const state =
        status.state === 'pending_user_action'
          ? 'awaiting_confirmation'
          : status.state === 'succeeded'
            ? 'succeeded'
            : status.state === 'cancelled'
              ? 'cancelled'
              : status.state === 'failed'
                ? 'failed'
                : status.state === 'requested'
                  ? 'installing'
                  : 'idle';
      useAppUpdateStore.getState().setInstallationStatus(status);
      useAppUpdateStore.getState().setState(state, {
        errorCode: status.errorCode,
        errorMessage: status.errorMessage
      });
      onSnapshot?.(useAppUpdateStore.getState());
    });
}
