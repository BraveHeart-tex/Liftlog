import { Icon } from '@/src/components/ui/icon';
import { SearchIcon } from 'lucide-react-native';
import type { ComponentProps } from 'react';

export const SearchInputIcon = (
  props: Partial<Exclude<ComponentProps<typeof Icon>, 'icon'>>
) => {
  return (
    <Icon
      icon={SearchIcon}
      className="text-muted-foreground"
      size={16}
      {...props}
    />
  );
};
