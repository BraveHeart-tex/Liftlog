import * as Haptics from 'expo-haptics';

export function triggerRestTimerImpact(
  style: Haptics.ImpactFeedbackStyle,
  errorMessage: string
) {
  Haptics.impactAsync(style).catch(error => {
    console.error(errorMessage, error);
  });
}
