export type InstalledBuildInfo = {
  packageName: string;
  versionName: string;
  versionCode: number;
  certificateSha256: string;
  isDebuggable: boolean;
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

export type UpdateFailureDiagnostic = {
  diagnosticId: string;
  attemptId: string;
  occurredAt: number;
  source: 'android_installer_callback';
  nativeStage: UpdateStage;
  resultCode: string;
  targetVersionName: string | null;
  targetVersionCode: number | null;
  rawStatus: number | null;
  statusMessage: string | null;
  blockingPackage: string | null;
  storageLocation: 'internal' | 'external' | 'other' | null;
};

export type PendingUpdateDiagnostics = {
  diagnostics: UpdateFailureDiagnostic[];
  droppedDiagnosticCount: number;
};

export interface LiftlogUpdaterApi {
  getInstalledBuildInfoAsync(): Promise<InstalledBuildInfo>;
  getStateAsync(): Promise<NativeUpdateState>;
  getPendingDiagnosticsAsync(): Promise<PendingUpdateDiagnostics>;
  acknowledgeDiagnosticAsync(request: {
    attemptId: string;
    diagnosticId: string;
  }): Promise<boolean>;
  reconcileAsync(): Promise<NativeUpdateState>;
  beginAttemptAsync(request: BeginAttemptRequest): Promise<NativeUpdateState>;
  getInstallPermissionAsync(): Promise<InstallPermissionStatus>;
  openInstallPermissionSettings(): void;
  verifyAndStageAsync(request: VerifyRequest): Promise<VerificationResult>;
  commitAsync(attemptId: string): Promise<NativeUpdateState>;
  resumePendingConfirmationAsync(attemptId: string): Promise<NativeUpdateState>;
  cancelAsync(attemptId: string): Promise<NativeUpdateState>;
  interruptAsync(attemptId: string): Promise<NativeUpdateState>;
  cleanupAsync(): Promise<NativeUpdateState>;
}
