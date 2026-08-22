import { triggerHapticMedium } from '@/src/lib/haptics/haptics';

export function triggerWorkoutEditModeHaptics() {
  triggerHapticMedium('workout edit mode');
}
