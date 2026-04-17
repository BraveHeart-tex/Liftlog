import type { DrizzleDb } from '@/src/db/client';
import { getSetting, setSetting } from './repository';

export const ONBOARDING_KEY = 'onboarding.completed';
export const DISPLAY_NAME_KEY = 'settings.display_name';

export function isOnboardingCompleted(db: DrizzleDb): boolean {
  return getSetting(db, ONBOARDING_KEY) === 'true';
}

export function completeOnboarding(db: DrizzleDb, displayName: string): void {
  setSetting(db, DISPLAY_NAME_KEY, displayName.trim());
  setSetting(db, ONBOARDING_KEY, 'true');
}

export function getDisplayName(db: DrizzleDb): string {
  return getSetting(db, DISPLAY_NAME_KEY) ?? '';
}
