import type { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle
} from 'react-native';
import { type Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

type SafeAreaViewProps = Omit<ViewProps, 'style'> & {
  className?: string;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

function getInsetPadding(
  edge: Edge,
  edges: Edge[],
  inset: number,
  style: ViewStyle
) {
  if (!edges.includes(edge)) {
    return undefined;
  }

  const paddingByEdge = {
    top: style.paddingTop,
    bottom: style.paddingBottom,
    left: style.paddingLeft,
    right: style.paddingRight
  }[edge];

  const paddingByAxis =
    edge === 'left' || edge === 'right'
      ? style.paddingHorizontal
      : style.paddingVertical;
  const padding = paddingByEdge ?? paddingByAxis ?? style.padding;

  return inset + (typeof padding === 'number' ? padding : 0);
}

export function SafeAreaView({
  children,
  className,
  edges = ['top', 'bottom', 'left', 'right'],
  style,
  ...props
}: SafeAreaViewProps) {
  const insets = useSafeAreaInsets();
  const flattenedStyle = StyleSheet.flatten(style) ?? {};

  const safeAreaStyle = {
    paddingTop: getInsetPadding('top', edges, insets.top, flattenedStyle),
    paddingBottom: getInsetPadding(
      'bottom',
      edges,
      insets.bottom,
      flattenedStyle
    ),
    paddingLeft: getInsetPadding('left', edges, insets.left, flattenedStyle),
    paddingRight: getInsetPadding('right', edges, insets.right, flattenedStyle)
  };

  return (
    <View {...props} className={className} style={[style, safeAreaStyle]}>
      {children}
    </View>
  );
}
