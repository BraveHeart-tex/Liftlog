import { useAppTheme } from '@/src/theme/app-theme-provider';
import { appFonts } from '@/src/theme/fonts';
import {
  DrumPicker,
  type DrumPickerProps,
  type DrumPickerRef
} from 'react-native-drum-picker';
import { forwardRef, type ReactElement, type RefAttributes } from 'react';

type WheelPickerComponent = <ItemT = string>(
  props: DrumPickerProps<ItemT> & RefAttributes<DrumPickerRef>
) => ReactElement | null;

const WheelPickerBase = forwardRef<DrumPickerRef, DrumPickerProps<unknown>>(
  function WheelPicker(
    {
      textColor,
      selectedTextColor,
      fontFamily = appFonts.faces.regular,
      selectedFontFamily = appFonts.faces.bold,
      showSelectionIndicator = false,
      backgroundColor = 'transparent',
      itemBackgroundColor = 'transparent',
      containerBackgroundColor = 'transparent',
      ...props
    },
    ref
  ) {
    const { colors } = useAppTheme();

    return (
      <DrumPicker
        {...props}
        ref={ref}
        textColor={textColor ?? colors.mutedForeground}
        selectedTextColor={selectedTextColor ?? colors.foreground}
        fontFamily={fontFamily}
        selectedFontFamily={selectedFontFamily}
        showSelectionIndicator={showSelectionIndicator}
        backgroundColor={backgroundColor}
        itemBackgroundColor={itemBackgroundColor}
        containerBackgroundColor={containerBackgroundColor}
      />
    );
  }
);

export const WheelPicker = WheelPickerBase as WheelPickerComponent;
