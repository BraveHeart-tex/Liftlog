import {
  AndroidHaptics,
  performAndroidHapticsAsync,
  selectionAsync
} from 'expo-haptics';
import { Platform } from 'react-native';

function triggerSelectionHaptics(androidHaptics: AndroidHaptics) {
  if (Platform.OS === 'android') {
    void performAndroidHapticsAsync(androidHaptics);

    return;
  }

  void selectionAsync();
}

export function triggerBottomTabNavigationHaptics() {
  triggerSelectionHaptics(AndroidHaptics.Virtual_Key);
}

export function triggerSegmentSelectionHaptics() {
  triggerSelectionHaptics(AndroidHaptics.Segment_Tick);
}
