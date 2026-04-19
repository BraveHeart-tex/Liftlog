import { useIndexRedirect } from '@/src/features/settings/hooks';
import { Redirect } from 'expo-router';

export default function Index() {
  const { href } = useIndexRedirect();

  return <Redirect href={href} />;
}
