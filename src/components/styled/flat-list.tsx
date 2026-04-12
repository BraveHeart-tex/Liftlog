import { styled } from 'nativewind';
import type { ReactNode } from 'react';
import { FlatList, type FlatListProps } from 'react-native';

type FlatListClassNameProps = {
  className?: string;
  contentContainerClassName?: string;
  columnWrapperClassName?: string;
  ListHeaderComponentClassName?: string;
  ListFooterComponentClassName?: string;
};

const StyledFlatListBase = styled(FlatList, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
  columnWrapperClassName: 'columnWrapperStyle',
  ListHeaderComponentClassName: 'ListHeaderComponentStyle',
  ListFooterComponentClassName: 'ListFooterComponentStyle'
});

export const StyledFlatList = StyledFlatListBase as typeof FlatList &
  (<ItemT>(props: FlatListProps<ItemT> & FlatListClassNameProps) => ReactNode);
