import { useDrizzle } from '@/src/components/database-provider';
import { isOnboardingCompleted } from '@/src/features/settings/onboarding';
import type { Href } from 'expo-router';

export function useIndexRedirect() {
  const db = useDrizzle();
  const isCompleted = isOnboardingCompleted(db);
  const href: Href = isCompleted ? '/(tabs)/workout' : '/onboarding';

  return {
    href
  };
}
