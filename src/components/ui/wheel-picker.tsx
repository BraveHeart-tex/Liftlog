import { useAppTheme } from '@/src/theme/app-theme-provider';
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
        showSelectionIndicator={showSelectionIndicator}
        backgroundColor={backgroundColor}
        itemBackgroundColor={itemBackgroundColor}
        containerBackgroundColor={containerBackgroundColor}
      />
    );
  }
);

export const WheelPicker = WheelPickerBase as WheelPickerComponent;
