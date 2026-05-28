import { getStyleColor } from '@/src/components/styled/text-input';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetTextInput
} from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import {
  forwardRef,
  type ComponentRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes
} from 'react';
import {
  StyleSheet,
  type FlatListProps,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle
} from 'react-native';

interface BottomSheetFlatListClassNameProps {
  className?: string;
  contentContainerClassName?: string;
  columnWrapperClassName?: string;
  ListHeaderComponentClassName?: string;
  ListFooterComponentClassName?: string;
}

interface BottomSheetScrollViewClassNameProps {
  className?: string;
  contentContainerClassName?: string;
}

interface BottomSheetTextInputClassNameProps {
  className?: string;
  placeholderClassName?: string;
  selectionClassName?: string;
}

type BottomSheetTextInputColorBridgeProps = TextInputProps & {
  placeholderStyle?: StyleProp<TextStyle>;
  selectionStyle?: StyleProp<TextStyle>;
};

type StyledBottomSheetTextInputRef = ComponentRef<typeof BottomSheetTextInput>;

const BottomSheetTextInputColorBridge = forwardRef<
  StyledBottomSheetTextInputRef,
  BottomSheetTextInputColorBridgeProps
>(function BottomSheetTextInputColorBridge(
  {
    placeholderStyle,
    selectionStyle,
    placeholderTextColor,
    selectionColor,
    style,
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
      style={[styles.textInputAndroidReset, style]}
      allowFontScaling={false}
      underlineColorAndroid="transparent"
    />
  );
});

const styles = StyleSheet.create({
  textInputAndroidReset: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0
  }
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

type StyledBottomSheetScrollViewRef = ComponentRef<
  typeof BottomSheetScrollView
>;

const StyledBottomSheetScrollViewBase = styled(BottomSheetScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle'
});

export const StyledBottomSheetScrollView =
  StyledBottomSheetScrollViewBase as ForwardRefExoticComponent<
    ScrollViewProps &
      BottomSheetScrollViewClassNameProps &
      RefAttributes<StyledBottomSheetScrollViewRef>
  >;

const StyledBottomSheetTextInputBase = styled(BottomSheetTextInputColorBridge, {
  className: 'style',
  placeholderClassName: 'placeholderStyle',
  selectionClassName: 'selectionStyle'
});

export const StyledBottomSheetTextInput =
  StyledBottomSheetTextInputBase as ForwardRefExoticComponent<
    TextInputProps &
      BottomSheetTextInputClassNameProps &
      RefAttributes<StyledBottomSheetTextInputRef>
  >;
