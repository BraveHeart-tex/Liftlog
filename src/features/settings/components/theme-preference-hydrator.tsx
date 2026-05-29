import { useDrizzle } from '@/src/components/database-provider';
import { getThemePreference } from '@/src/features/settings/repository';
import { useEffect } from 'react';

export function ThemePreferenceHydrator() {
  const db = useDrizzle();

  useEffect(() => {
    getThemePreference(db);
  }, [db]);

  return null;
}
