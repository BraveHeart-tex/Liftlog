import { useIndexRedirect } from '@/src/features/settings/hooks/use-index-redirect';
import { Redirect } from 'expo-router';

export default function Index() {
  const { href } = useIndexRedirect();

  return <Redirect href={href} />;
}
