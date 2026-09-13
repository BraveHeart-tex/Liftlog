import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

interface ExactAlarmModule {
  getAccess(): { supported: boolean; granted: boolean };
  openSettings(): void;
}

const nativeModule =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<ExactAlarmModule>('LiftlogExactAlarm')
    : null;

export function getExactAlarmAccess() {
  return nativeModule?.getAccess() ?? { supported: false, granted: true };
}

export function openExactAlarmSettings() {
  nativeModule?.openSettings();
}
