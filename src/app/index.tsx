import { useDrizzle } from '@/src/components/database-provider';
import { isOnboardingCompleted } from '@/src/features/settings/onboarding';
import { Redirect, type Href } from 'expo-router';

const tabsRoute = '/(tabs)' as Href;

export default function Index() {
  const db = useDrizzle();
  const completed = isOnboardingCompleted(db);

  return completed ? (
    <Redirect href={tabsRoute} />
  ) : (
    <Redirect href="/onboarding" />
  );
}
