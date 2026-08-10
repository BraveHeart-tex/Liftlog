import { AndroidHaptics } from 'expo-haptics';
import { triggerHapticSelection } from '@/src/lib/haptics/haptics';

export function triggerBottomTabNavigationHaptics() {
  triggerHapticSelection('bottom tab navigation', AndroidHaptics.Virtual_Key);
}

export function triggerSegmentSelectionHaptics() {
  triggerHapticSelection('segment selection', AndroidHaptics.Segment_Tick);
}
