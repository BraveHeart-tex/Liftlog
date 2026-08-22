import { useReducedMotion as useReanimatedReducedMotion } from 'react-native-reanimated';

/**
 * Shared reduced-motion policy for motion that is not owned by Reanimated.
 * Reanimated subscribes to the OS accessibility preference and updates this
 * value while the app is running.
 */
export function useReducedMotion(): boolean {
  return useReanimatedReducedMotion() ?? false;
}
