import { getStyleColor } from '@/src/components/styled/text-input';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetTextInput
} from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import {
  type ComponentRef,
  forwardRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes
} from 'react';
import type {
  FlatListProps,
  ScrollViewProps,
  StyleProp,
  TextInputProps,
  TextStyle
} from 'react-native';

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

type BottomSheetTextInputClassNameProps = {
  className?: string;
  placeholderClassName?: string;
  selectionClassName?: string;
};

type BottomSheetTextInputColorBridgeProps = TextInputProps & {
  placeholderStyle?: StyleProp<TextStyle>;
  selectionStyle?: StyleProp<TextStyle>;
};

export type StyledBottomSheetTextInputRef = ComponentRef<
  typeof BottomSheetTextInput
>;

const BottomSheetTextInputColorBridge = forwardRef<
  StyledBottomSheetTextInputRef,
  BottomSheetTextInputColorBridgeProps
>(function BottomSheetTextInputColorBridge(
  {
    placeholderStyle,
    selectionStyle,
    placeholderTextColor,
    selectionColor,
    ...props
  },
  ref
) {
  return (
    <BottomSheetTextInput
      ref={ref}
      placeholderTextColor={
        placeholderTextColor ?? getStyleColor(placeholderStyle)
      }
      selectionColor={selectionColor ?? getStyleColor(selectionStyle)}
      {...props}
    />
  );
});

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

const StyledBottomSheetTextInputBase = styled(BottomSheetTextInputColorBridge, {
  className: {
    target: 'style',
    nativeStyleMapping: {
      textAlign: true
    }
  },
  placeholderClassName: 'placeholderStyle',
  selectionClassName: 'selectionStyle'
});

export const StyledBottomSheetTextInput =
  StyledBottomSheetTextInputBase as ForwardRefExoticComponent<
    TextInputProps &
      BottomSheetTextInputClassNameProps &
      RefAttributes<StyledBottomSheetTextInputRef>
  >;
