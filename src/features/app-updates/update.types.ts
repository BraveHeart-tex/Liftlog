export interface InstalledBuild {
  versionName: string;
  versionCode: number;
}

export interface GitHubAsset {
  id: number;
  name: string;
  size: number;
  url: string;
  browser_download_url?: string;
  digest?: string | null;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  body: string | null;
  assets: GitHubAsset[];
}

export interface AvailableUpdate {
  releaseId: number;
  versionName: string;
  versionCode: number;
  apkFilename: string;
  apkDownloadUrl: string;
  sha256: string;
  sizeBytes: number;
  releaseNotes: string;
}

export interface UpdateCache {
  etag?: string;
  lastSuccessfulCheckAt: number;
  release?: AvailableUpdate;
  dismissedVersionCode?: number;
}

export type UpdateErrorCode =
  | 'offline'
  | 'rate_limited'
  | 'malformed_release'
  | 'check_failed';

export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'up_to_date' | 'error';
  installedVersion: string;
  lastSuccessfulCheckAt?: number;
  release?: AvailableUpdate;
  error?: { code: UpdateErrorCode };
}

export interface UpdateDiagnostic {
  code: 'UPDATE_CHECK_FAILED' | 'UPDATE_MANIFEST_INVALID';
  stage: 'release_discovery' | 'manifest_validation';
  androidApiLevel: number | string;
  manifestSchema?: number;
  httpStatusClass?: string;
}
