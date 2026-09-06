import type { AvailableUpdate, GitHubRelease } from './update.types';

interface UpdateManifestV1 {
  schemaVersion: 1;
  versionName: string;
  versionCode: number;
  apkFilename: string;
  sha256: string;
  sizeBytes: number;
}

export class UpdateManifestError extends Error {}

const MANIFEST_NAME = 'update.json';
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseUpdateManifest(value: unknown): UpdateManifestV1 {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new UpdateManifestError('Unsupported update manifest schema.');
  }

  if ('url' in value || 'downloadUrl' in value || 'apkUrl' in value) {
    throw new UpdateManifestError('Update manifests cannot provide URLs.');
  }

  if (
    typeof value.versionName !== 'string' ||
    !VERSION_PATTERN.test(value.versionName) ||
    !Number.isSafeInteger(value.versionCode) ||
    (value.versionCode as number) <= 0 ||
    typeof value.apkFilename !== 'string' ||
    !value.apkFilename ||
    value.apkFilename.includes('/') ||
    typeof value.sha256 !== 'string' ||
    !SHA256_PATTERN.test(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes) ||
    (value.sizeBytes as number) <= 0
  ) {
    throw new UpdateManifestError('Malformed update manifest.');
  }

  return value as unknown as UpdateManifestV1;
}

export function resolveUpdateRelease(
  release: GitHubRelease,
  manifestValue: unknown
): AvailableUpdate {
  if (release.draft || release.prerelease || !Array.isArray(release.assets)) {
    throw new UpdateManifestError('Release is not stable.');
  }

  const manifest = parseUpdateManifest(manifestValue);
  const expectedTag = `v${manifest.versionName}`;

  if (release.tag_name !== expectedTag) {
    throw new UpdateManifestError('Release tag does not match the manifest.');
  }

  const manifests = release.assets.filter(
    asset => asset.name === MANIFEST_NAME
  );
  const apks = release.assets.filter(
    asset => asset.name === manifest.apkFilename
  );

  if (manifests.length !== 1 || apks.length !== 1) {
    throw new UpdateManifestError('Release assets are missing or duplicated.');
  }

  const apk = apks[0];

  if (
    !apk.browser_download_url ||
    apk.size !== manifest.sizeBytes ||
    (apk.digest && apk.digest !== `sha256:${manifest.sha256}`)
  ) {
    throw new UpdateManifestError('APK metadata does not match the manifest.');
  }

  return {
    releaseId: release.id,
    versionName: manifest.versionName,
    versionCode: manifest.versionCode,
    apkFilename: manifest.apkFilename,
    apkDownloadUrl: apk.browser_download_url,
    sha256: manifest.sha256,
    sizeBytes: manifest.sizeBytes,
    releaseNotes: release.body ?? ''
  };
}
