import { impactAsync, type ImpactFeedbackStyle } from 'expo-haptics';

export function triggerRestTimerImpact(
  style: ImpactFeedbackStyle,
  errorMessage: string
) {
  impactAsync(style).catch(error => {
    console.error(errorMessage, error);
  });
}
