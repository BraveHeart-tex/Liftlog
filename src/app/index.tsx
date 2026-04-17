import { useDrizzle } from '@/src/components/database-provider';
import { isOnboardingCompleted } from '@/src/features/settings/onboarding';
import { Redirect } from 'expo-router';

const workoutRoute = '/(tabs)/workout';

export default function Index() {
  const db = useDrizzle();
  const completed = isOnboardingCompleted(db);

  return completed ? (
    <Redirect href={workoutRoute} />
  ) : (
    <Redirect href="/onboarding" />
  );
}
