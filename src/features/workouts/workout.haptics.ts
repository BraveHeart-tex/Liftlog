import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics';

export function triggerWorkoutEditModeHaptics() {
  impactAsync(ImpactFeedbackStyle.Medium).catch(error => {
    console.error('Failed to trigger workout edit mode haptics', error);
  });
}
