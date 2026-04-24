import type { DrizzleDb } from '@/src/db/client';
import { getSetting, setSetting } from './repository';

const ONBOARDING_KEY = 'onboarding.completed';
const DISPLAY_NAME_KEY = 'settings.display_name';

export function isOnboardingCompleted(db: DrizzleDb): boolean {
  return getSetting(db, ONBOARDING_KEY) === 'true';
}

export function completeOnboarding(db: DrizzleDb, displayName: string): void {
  setSetting(db, DISPLAY_NAME_KEY, displayName.trim());
  setSetting(db, ONBOARDING_KEY, 'true');
}
