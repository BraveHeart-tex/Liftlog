import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

interface ExactAlarmModule {
  getAccess(): { supported: boolean; granted: boolean };
  openSettings(): void;
  openNotificationChannelSettings?(channelId: string): void;
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

export function openRestTimerNotificationChannelSettings() {
  if (!nativeModule?.openNotificationChannelSettings) {
    return false;
  }

  nativeModule.openNotificationChannelSettings('rest-timer-v2');

  return true;
}
