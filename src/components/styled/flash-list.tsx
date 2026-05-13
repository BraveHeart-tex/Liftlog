import { FlashList, type FlashListProps } from '@shopify/flash-list';
import { styled } from 'nativewind';
import type { ReactNode } from 'react';

interface FlashListClassNameProps {
  className?: string;
  contentContainerClassName?: string;
  ListEmptyComponentClassName?: string;
  ListHeaderComponentClassName?: string;
  ListFooterComponentClassName?: string;
}

const StyledFlashListBase = styled(FlashList, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
  ListHeaderComponentClassName: 'ListHeaderComponentStyle',
  ListFooterComponentClassName: 'ListFooterComponentStyle'
});

export const StyledFlashList = StyledFlashListBase as typeof FlashList &
  (<ItemT>(
    props: FlashListProps<ItemT> & FlashListClassNameProps
  ) => ReactNode);
