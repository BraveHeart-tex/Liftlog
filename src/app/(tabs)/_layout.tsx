import { useTabBarTheme } from '@/src/theme/app-theme-provider';
import { Tabs } from 'expo-router';
import {
  ClockIcon,
  DumbbellIcon,
  ListIcon,
  SettingsIcon
} from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_HEIGHT = 66;
const TAB_BAR_TOP_PADDING = 8;
const TAB_BAR_BOTTOM_PADDING = 10;
const ANDROID_TAB_BAR_EXTRA_BOTTOM_PADDING = 8;
const TAB_ICON_SIZE = 22;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarTheme = useTabBarTheme();
  const tabBarBottomPadding =
    Platform.OS === 'android'
      ? TAB_BAR_BOTTOM_PADDING + ANDROID_TAB_BAR_EXTRA_BOTTOM_PADDING
      : TAB_BAR_BOTTOM_PADDING;
  const bottomPadding = Math.max(insets.bottom, tabBarBottomPadding);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabBarTheme.activeTintColor,
        tabBarInactiveTintColor: tabBarTheme.inactiveTintColor,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: tabBarTheme.backgroundColor,
            borderTopColor: tabBarTheme.borderColor,
            height: TAB_BAR_HEIGHT + bottomPadding,
            paddingBottom: bottomPadding
          }
        ],
        sceneStyle: {
          backgroundColor: tabBarTheme.sceneBackgroundColor
        }
      }}
    >
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[styles.iconCapsule, focused && styles.activeIconCapsule]}
            >
              <DumbbellIcon color={color} size={TAB_ICON_SIZE} />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[styles.iconCapsule, focused && styles.activeIconCapsule]}
            >
              <ListIcon color={color} size={TAB_ICON_SIZE} />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[styles.iconCapsule, focused && styles.activeIconCapsule]}
            >
              <ClockIcon color={color} size={TAB_ICON_SIZE} />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[styles.iconCapsule, focused && styles.activeIconCapsule]}
            >
              <SettingsIcon color={color} size={TAB_ICON_SIZE} />
            </View>
          )
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconCapsule: {
    backgroundColor: 'rgba(255, 77, 0, 0.12)'
  },
  iconCapsule: {
    alignItems: 'center',
    borderRadius: 16,
    height: 34,
    justifyContent: 'center',
    width: 48
  },
  tabBar: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    elevation: 18,
    paddingTop: TAB_BAR_TOP_PADDING,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -8
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: 18
  },
  tabBarIcon: {
    height: 34,
    marginTop: 0
  },
  tabBarItem: {
    paddingVertical: 4
  },
  tabBarLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  }
});
