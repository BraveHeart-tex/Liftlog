import { Text } from '@/src/components/ui/text';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import WheelPickerBase, {
  type WheelPickerProps as BaseWheelPickerProps,
  type PickerItem,
  type RenderItem,
  type RenderItemProps
} from '@quidone/react-native-wheel-picker';
import { styled } from 'nativewind';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

interface WheelPickerClassNameProps {
  className?: string;
  itemTextClassName?: string;
  overlayItemClassName?: string;
  contentContainerClassName?: string;
  renderWhen?: boolean;
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

const getPickerHeight = (itemHeight: number, visibleItemCount: number) => {
  const maxStep = Math.trunc((visibleItemCount + 2) / 2);
  const faceCount = maxStep * 2 + 1;

  if (faceCount === 7) {
    return itemHeight * 5;
  }

  return Array.from({ length: maxStep }, (_, index) => {
    const degree = ((index + 1) * 90) / maxStep;

    return itemHeight * Math.cos((degree * Math.PI) / 180) * 2;
  }).reduce((height, faceHeight) => height + faceHeight, itemHeight);
};

const WheelPickerBridge = <ItemT extends PickerItem<any>>({
  renderItem,
  renderWhen = true,
  width = 'auto',
  itemHeight = 48,
  visibleItemCount = 5,
  style,
  ...props
}: WheelPickerProps<ItemT>) => {
  const { colors } = useAppTheme();

  if (!renderWhen) {
    return (
      <View
        className="items-center justify-center"
        style={[
          { width, height: getPickerHeight(itemHeight, visibleItemCount) },
          style
        ]}
      >
        <ActivityIndicator color={colors.mutedForeground} />
      </View>
    );
  }

  return (
    <WheelPickerBase
      {...props}
      width={width}
      itemHeight={itemHeight}
      visibleItemCount={visibleItemCount}
      style={style}
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
