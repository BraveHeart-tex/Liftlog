import type { InstallationStatus } from '@/modules/liftlog-updater/src';

export interface UpdateManifest {
  versionName: string;
  versionCode: number;
  apkFilename: string;
  sha256: string;
  sizeBytes: number;
  releaseNotes: string;
  mandatory?: boolean;
}

export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GitHubRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  prerelease: boolean;
  draft: boolean;
  assets: GitHubReleaseAsset[];
  html_url: string;
}

export interface AvailableUpdate {
  release: GitHubRelease;
  manifest: UpdateManifest;
  apkUrl: string;
  apkSizeBytes: number;
}

export type AppUpdateState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'permission_required'
  | 'downloading'
  | 'verifying'
  | 'installing'
  | 'awaiting_confirmation'
  | 'succeeded'
  | 'cancelled'
  | 'failed';

export interface AppUpdateSnapshot {
  state: AppUpdateState;
  availableUpdate: AvailableUpdate | null;
  bytesDownloaded: number;
  totalBytes: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  installationStatus: InstallationStatus | null;
}
