import { requireNativeModule } from 'expo';
import type { NativeModule } from 'expo';
import { Platform } from 'react-native';

export type InstalledBuildInfo = {
  packageName: string;
  versionName: string;
  versionCode: number;
  certificateSha256: string;
};

export type InstallPermissionStatus = {
  canRequestPackageInstalls: boolean;
  settingsSupported: boolean;
};

export type ApkVerificationRequest = {
  fileUri: string;
  expectedSha256: string;
  expectedPackageName: string;
  expectedVersionCode: number;
};

export type ApkVerificationResult = {
  fileUri: string;
  sha256: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  certificateSha256: string;
};

export type InstallationStatus = {
  state:
    | 'idle'
    | 'requested'
    | 'pending_user_action'
    | 'succeeded'
    | 'failed'
    | 'cancelled';
  sessionId: number | null;
  intendedVersionCode: number | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export type InstallationStatusEvent = InstallationStatus;

type LiftlogUpdaterModuleEvents = {
  onInstallationStatusChanged: (event: InstallationStatusEvent) => void;
};

export interface LiftlogUpdaterModule extends NativeModule<LiftlogUpdaterModuleEvents> {
  getInstalledBuildInfoAsync(): Promise<InstalledBuildInfo>;
  getInstallPermissionStatusAsync(): Promise<InstallPermissionStatus>;
  openInstallPermissionSettings(): void;
  verifyApkAsync(
    request: ApkVerificationRequest
  ): Promise<ApkVerificationResult>;
  installVerifiedApkAsync(): Promise<InstallationStatus>;
  getInstallationStatusAsync(): Promise<InstallationStatus>;
  cancelInstallationAsync(): Promise<InstallationStatus>;
  cleanupAsync(): Promise<void>;
}

export const LiftlogUpdater: LiftlogUpdaterModule | null =
  Platform.OS === 'android'
    ? requireNativeModule<LiftlogUpdaterModule>('LiftlogUpdater')
    : null;
