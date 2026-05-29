import { Text } from '@/src/components/ui/text';
import WheelPickerBase, {
  type WheelPickerProps as BaseWheelPickerProps,
  type PickerItem,
  type RenderItem,
  type RenderItemProps
} from '@quidone/react-native-wheel-picker';
import { styled } from 'nativewind';
import type { ReactNode } from 'react';
import { View } from 'react-native';

interface WheelPickerClassNameProps {
  className?: string;
  itemTextClassName?: string;
  overlayItemClassName?: string;
  contentContainerClassName?: string;
}

export type WheelPickerProps<ItemT extends PickerItem<any>> =
  BaseWheelPickerProps<ItemT> & WheelPickerClassNameProps;

const defaultRenderItem = <ItemT extends PickerItem<any>>({
  item,
  itemTextStyle
}: RenderItemProps<ItemT>) => {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-foreground text-center" style={itemTextStyle}>
        {item.label ?? String(item.value)}
      </Text>
    </View>
  );
};

const WheelPickerBridge = <ItemT extends PickerItem<any>>({
  renderItem,
  ...props
}: WheelPickerProps<ItemT>) => {
  return (
    <WheelPickerBase
      {...props}
      renderItem={renderItem ?? (defaultRenderItem as RenderItem<ItemT>)}
    />
  );
};

const StyledWheelPickerBase = styled(WheelPickerBridge, {
  className: 'style',
  itemTextClassName: 'itemTextStyle',
  overlayItemClassName: 'overlayItemStyle',
  contentContainerClassName: 'contentContainerStyle'
});

export const WheelPicker = StyledWheelPickerBase as typeof WheelPickerBase &
  (<ItemT extends PickerItem<any>>(
    props: WheelPickerProps<ItemT>
  ) => ReactNode);

export type { PickerItem, RenderItem, RenderItemProps };
