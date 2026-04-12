import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import type { ReactNode } from 'react';
import type { FlatListProps, ScrollViewProps } from 'react-native';

type BottomSheetFlatListClassNameProps = {
  className?: string;
  contentContainerClassName?: string;
  columnWrapperClassName?: string;
  ListHeaderComponentClassName?: string;
  ListFooterComponentClassName?: string;
};

type BottomSheetScrollViewClassNameProps = {
  className?: string;
  contentContainerClassName?: string;
};

export const StyledBottomSheetBackdrop = styled(BottomSheetBackdrop, {
  className: 'style'
});

const StyledBottomSheetFlatListBase = styled(BottomSheetFlatList, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
  columnWrapperClassName: 'columnWrapperStyle',
  ListHeaderComponentClassName: 'ListHeaderComponentStyle',
  ListFooterComponentClassName: 'ListFooterComponentStyle'
});

export const StyledBottomSheetFlatList = StyledBottomSheetFlatListBase as <
  ItemT
>(
  props: FlatListProps<ItemT> & BottomSheetFlatListClassNameProps
) => ReactNode;

const StyledBottomSheetScrollViewBase = styled(BottomSheetScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle'
});

export const StyledBottomSheetScrollView = StyledBottomSheetScrollViewBase as (
  props: ScrollViewProps & BottomSheetScrollViewClassNameProps
) => ReactNode;
