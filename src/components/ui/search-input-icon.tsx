import { Icon } from '@/src/components/ui/icon';
import { SearchIcon } from 'lucide-react-native';
import type { ComponentProps } from 'react';

export const SearchInputIcon = (
  props: Partial<Omit<ComponentProps<typeof Icon>, 'as'>>
) => {
  return <Icon {...props} as={SearchIcon} tone="mutedForeground" size="sm" />;
};
