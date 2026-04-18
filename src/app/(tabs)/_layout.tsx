import { useTabBarTheme } from '@/src/theme/app-theme-provider';
import { Tabs } from 'expo-router';
import {
  ClockIcon,
  DumbbellIcon,
  ListIcon,
  SettingsIcon
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_HEIGHT = 60;
const TAB_BAR_TOP_PADDING = 6;
const TAB_BAR_BOTTOM_PADDING = 6;

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
          height: TAB_BAR_HEIGHT + bottomPadding,
          paddingTop: TAB_BAR_TOP_PADDING,
          paddingBottom: bottomPadding
        },
        tabBarLabelStyle: {
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
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <ClockIcon color={color} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size} />
          )
        }}
      />
    </Tabs>
  );
}
