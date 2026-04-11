import { tabBarTheme } from '@/src/theme/tokens';
import { Tabs } from 'expo-router';
import {
  ClockIcon,
  DumbbellIcon,
  ListIcon,
  SettingsIcon
} from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabBarTheme.activeTintColor,
        tabBarInactiveTintColor: tabBarTheme.inactiveTintColor,
        tabBarStyle: {
          backgroundColor: tabBarTheme.backgroundColor,
          borderTopColor: tabBarTheme.borderColor,
          height: 72,
          paddingTop: 8,
          paddingBottom: 8
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600'
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
