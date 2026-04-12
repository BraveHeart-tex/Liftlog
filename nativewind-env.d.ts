/// <reference types="react-native-css/types" />

import '@gorhom/bottom-sheet';
import 'react-native';

declare module 'react-native' {
  interface ActivityIndicatorProps {
    className?: string;
  }

  interface FlatListProps<ItemT> {
    className?: string;
    contentContainerClassName?: string;
    columnWrapperClassName?: string;
    ListHeaderComponentClassName?: string;
    ListFooterComponentClassName?: string;
  }

  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }

  interface TextInputProps {
    placeholderClassName?: string;
    selectionClassName?: string;
  }
}

declare module '@gorhom/bottom-sheet' {
  interface BottomSheetDefaultBackdropProps {
    className?: string;
  }
}
