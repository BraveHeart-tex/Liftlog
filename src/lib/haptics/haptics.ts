import {
  type AndroidHaptics,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync,
  performAndroidHapticsAsync,
  selectionAsync
} from 'expo-haptics';
import { Platform } from 'react-native';

function reportHapticFailure(operation: string, error: unknown) {
  console.error(`Failed to trigger ${operation} haptics`, error);
}

function runHaptic(operation: string, trigger: () => Promise<void>) {
  void trigger().catch(error => reportHapticFailure(operation, error));
}

export function triggerHapticSelection(
  operation = 'selection',
  androidHaptics?: AndroidHaptics
) {
  if (Platform.OS === 'android' && androidHaptics !== undefined) {
    runHaptic(operation, () => performAndroidHapticsAsync(androidHaptics));

    return;
  }

  runHaptic(operation, selectionAsync);
}

export function triggerHapticImpact(
  style: ImpactFeedbackStyle,
  operation = 'impact'
) {
  runHaptic(operation, () => impactAsync(style));
}

export function triggerHapticLight(operation = 'light impact') {
  triggerHapticImpact(ImpactFeedbackStyle.Light, operation);
}

export function triggerHapticMedium(operation = 'medium impact') {
  triggerHapticImpact(ImpactFeedbackStyle.Medium, operation);
}

export function triggerHapticWarning(operation = 'warning') {
  runHaptic(operation, () =>
    notificationAsync(NotificationFeedbackType.Warning)
  );
}

export function triggerHapticSuccess(operation = 'success') {
  runHaptic(operation, () =>
    notificationAsync(NotificationFeedbackType.Success)
  );
}
