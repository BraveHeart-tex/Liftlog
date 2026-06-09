import { useTabBarTheme } from '@/src/theme/app-theme-provider';
import { appFonts } from '@/src/theme/fonts';
import { iconSizes, nativeFontSizes } from '@/src/theme/sizes';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { ClockIcon, DumbbellIcon, ListIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Text as NativeText,
  Platform,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_HEIGHT = 66;
const TAB_BAR_TOP_PADDING = 8;
const TAB_BAR_BOTTOM_PADDING = 10;
const ANDROID_TAB_BAR_EXTRA_BOTTOM_PADDING = 16;
const TAB_ICON_SIZE = iconSizes.lg;

const TAB_BAR_HORIZONTAL_PADDING = 12;
const ACTIVE_PILL_WIDTH = 48;
const ACTIVE_PILL_HEIGHT = 34;

function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabBarTheme = useTabBarTheme();
  const [barWidth, setBarWidth] = useState(0);

  const tabBarBottomPadding =
    Platform.OS === 'android'
      ? TAB_BAR_BOTTOM_PADDING + ANDROID_TAB_BAR_EXTRA_BOTTOM_PADDING
      : TAB_BAR_BOTTOM_PADDING;

  const bottomPadding = Math.max(insets.bottom, tabBarBottomPadding);

  const visibleRoutes = state.routes;

  const activeRouteKey = state.routes[state.index]?.key;
  const activeIndex = Math.max(
    0,
    visibleRoutes.findIndex(route => route.key === activeRouteKey)
  );

  const tabWidth =
    visibleRoutes.length > 0
      ? (barWidth - TAB_BAR_HORIZONTAL_PADDING * 2) / visibleRoutes.length
      : 0;

  const indicatorIndex = useSharedValue(activeIndex);

  useEffect(() => {
    indicatorIndex.value = withSpring(activeIndex, {
      damping: 22,
      stiffness: 260,
      mass: 0.8
    });
  }, [activeIndex, indicatorIndex]);

  const indicatorStyle = useAnimatedStyle(() => {
    const centeredOffset = (tabWidth - ACTIVE_PILL_WIDTH) / 2;

    return {
      opacity: tabWidth > 0 ? 1 : 0,
      transform: [
        {
          translateX:
            TAB_BAR_HORIZONTAL_PADDING +
            indicatorIndex.value * tabWidth +
            centeredOffset
        }
      ]
    };
  }, [tabWidth]);

  return (
    <View
      onLayout={event => setBarWidth(event.nativeEvent.layout.width)}
      style={[
        styles.tabBar,
        {
          backgroundColor: tabBarTheme.backgroundColor,
          borderTopColor: tabBarTheme.borderColor,
          height: TAB_BAR_HEIGHT + bottomPadding,
          paddingBottom: bottomPadding
        }
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activePill,
          {
            backgroundColor: 'rgba(255, 77, 0, 0.12)'
          },
          indicatorStyle
        ]}
      />

      {visibleRoutes.map(route => {
        const descriptor = descriptors[route.key];
        const { options } = descriptor;
        const focused = route.key === activeRouteKey;

        const color = focused
          ? tabBarTheme.activeTintColor
          : tabBarTheme.inactiveTintColor;

        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : (options.title ?? route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : undefined}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <View style={styles.iconSlot}>
              {options.tabBarIcon?.({
                focused,
                color,
                size: TAB_ICON_SIZE
              })}
            </View>

            <NativeText
              numberOfLines={1}
              style={[
                styles.tabLabel,
                {
                  color
                }
              ]}
            >
              {label}
            </NativeText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const tabBarTheme = useTabBarTheme();

  return (
    <Tabs
      tabBar={props => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: tabBarTheme.sceneBackgroundColor
        }
      }}
    >
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color, size }) => (
            <DumbbellIcon color={color} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color, size }) => (
            <ListIcon color={color} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => (
            <ClockIcon color={color} size={size} />
          )
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activePill: {
    borderRadius: 16,
    height: ACTIVE_PILL_HEIGHT,
    left: 0,
    position: 'absolute',
    top: TAB_BAR_TOP_PADDING + 4,
    width: ACTIVE_PILL_WIDTH
  },
  iconSlot: {
    alignItems: 'center',
    height: ACTIVE_PILL_HEIGHT,
    justifyContent: 'center',
    width: ACTIVE_PILL_WIDTH
  },
  tabBar: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0,
    elevation: 0,
    flexDirection: 'row',
    paddingHorizontal: TAB_BAR_HORIZONTAL_PADDING,
    paddingTop: TAB_BAR_TOP_PADDING,
    shadowColor: 'transparent'
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    paddingVertical: 4
  },
  tabLabel: {
    fontFamily: appFonts.faces.semiBold,
    fontSize: nativeFontSizes.tabLabel,
    fontWeight: '600',
    marginTop: 2
  }
});
