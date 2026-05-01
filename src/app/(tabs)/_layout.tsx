import { useTabBarTheme } from '@/src/theme/app-theme-provider';
import { Tabs } from 'expo-router';
import {
  ClockIcon,
  DumbbellIcon,
  ListIcon,
  SettingsIcon
} from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_HEIGHT = 62;
const TAB_BAR_TOP_PADDING = 6;
const TAB_BAR_BOTTOM_PADDING = 8;
const TAB_ICON_SIZE = 22;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarTheme = useTabBarTheme();
  const bottomPadding = Math.max(insets.bottom, TAB_BAR_BOTTOM_PADDING);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabBarTheme.activeTintColor,
        tabBarInactiveTintColor: tabBarTheme.inactiveTintColor,
        tabBarStyle: {
          backgroundColor: tabBarTheme.backgroundColor,
          borderTopColor: tabBarTheme.borderColor,
          borderTopWidth: 1,
          elevation: 16,
          height: TAB_BAR_HEIGHT + bottomPadding,
          paddingTop: TAB_BAR_TOP_PADDING,
          paddingBottom: bottomPadding,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0,
          shadowRadius: 18
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          fontWeight: '500'
        },
        sceneStyle: {
          backgroundColor: tabBarTheme.sceneBackgroundColor
        }
      }}
    >
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color }) => (
            <DumbbellIcon color={color} size={TAB_ICON_SIZE} />
          )
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => (
            <ListIcon color={color} size={TAB_ICON_SIZE} />
          )
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <ClockIcon color={color} size={TAB_ICON_SIZE} />
          )
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <SettingsIcon color={color} size={TAB_ICON_SIZE} />
          )
        }}
      />
    </Tabs>
  );
}
