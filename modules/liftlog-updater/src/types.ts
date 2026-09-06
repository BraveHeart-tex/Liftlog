export type InstalledBuildInfo = {
  packageName: string;
  versionName: string;
  versionCode: number;
  certificateSha256: string;
};

export type UpdateStage =
  | 'idle'
  | 'downloading'
  | 'verifying'
  | 'staged'
  | 'committed'
  | 'pending_confirmation'
  | 'succeeded'
  | 'cancelled'
  | 'failed'
  | 'interrupted';

export type NativeUpdateState = {
  attemptId: string | null;
  stage: UpdateStage;
  targetVersionName: string | null;
  targetVersionCode: number | null;
  fileUri: string | null;
  sessionId: number | null;
  pendingConfirmation: boolean;
  updateExcluded: boolean;
  resultCode: string | null;
};

export type BeginAttemptRequest = {
  attemptId: string;
  targetVersionName: string;
  targetVersionCode: number;
  sizeBytes: number;
  sha256: string;
};

export type VerifyRequest = {
  attemptId: string;
  expectedPackageName: string;
  expectedVersionName: string;
  expectedVersionCode: number;
  expectedSizeBytes: number;
  expectedSha256: string;
};

export type VerificationResult = {
  packageName: string;
  versionName: string;
  versionCode: number;
  sizeBytes: number;
  sha256: string;
  certificateSha256: string;
  sessionId: number;
};

export type InstallPermissionStatus = {
  granted: boolean;
  settingsSupported: boolean;
};

export interface LiftlogUpdaterApi {
  getInstalledBuildInfoAsync(): Promise<InstalledBuildInfo>;
  getStateAsync(): Promise<NativeUpdateState>;
  reconcileAsync(): Promise<NativeUpdateState>;
  beginAttemptAsync(request: BeginAttemptRequest): Promise<NativeUpdateState>;
  getInstallPermissionAsync(): Promise<InstallPermissionStatus>;
  openInstallPermissionSettings(): void;
  verifyAndStageAsync(request: VerifyRequest): Promise<VerificationResult>;
  commitAsync(attemptId: string): Promise<NativeUpdateState>;
  cancelAsync(attemptId: string): Promise<NativeUpdateState>;
  cleanupAsync(): Promise<NativeUpdateState>;
}
