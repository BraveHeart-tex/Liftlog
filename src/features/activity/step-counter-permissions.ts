import { StepCounter } from 'expo-step-counter';
import { PermissionsAndroid, Platform } from 'react-native';

function getIsActivityRecognitionRuntimePermissionRequired(): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }

  return Number(Platform.Version) >= 29;
}

export async function requestActivityRecognitionPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  if (!getIsActivityRecognitionRuntimePermissionRequired()) {
    return true;
  }

  if (StepCounter.hasActivityRecognitionPermission()) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}
