import { triggerHapticImpact } from '@/src/lib/haptics/haptics';
import type { ImpactFeedbackStyle } from 'expo-haptics';

export function triggerRestTimerImpact(
  style: ImpactFeedbackStyle,
  errorMessage: string
) {
  triggerHapticImpact(
    style,
    errorMessage.replace(/^Failed to trigger /, '').replace(/ haptics$/, '')
  );
}
