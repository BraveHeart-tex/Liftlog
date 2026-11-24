// jest-expo has no Android native mock for expo-notifications, so the real package
// fails to load. This mock covers the names the app imports; tests override
// individual functions with jest.mocked(...).
import type { NotificationPermissionsStatus } from 'expo-notifications';

export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';

export { IosAuthorizationStatus } from 'expo-notifications/build/NotificationPermissions.types';

export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';

export const DEFAULT_ACTION_IDENTIFIER =
  'expo.modules.notifications.actions.DEFAULT';

const deniedPermissions = {
  status: 'undetermined',
  granted: false,
  canAskAgain: true,
  expires: 'never'
} as NotificationPermissionsStatus;

export const getPermissionsAsync = jest.fn(async () => deniedPermissions);

export const requestPermissionsAsync = jest.fn(async () => deniedPermissions);

export const scheduleNotificationAsync = jest.fn(async () => 'notification-id');

export const cancelScheduledNotificationAsync = jest.fn(async () => undefined);

export const dismissNotificationAsync = jest.fn(async () => undefined);

export const getAllScheduledNotificationsAsync = jest.fn(async () => []);

export const getPresentedNotificationsAsync = jest.fn(async () => []);

export const setNotificationChannelAsync = jest.fn(async () => null);

export const deleteNotificationChannelAsync = jest.fn(async () => undefined);

export const setNotificationHandler = jest.fn();

export const clearLastNotificationResponse = jest.fn();

export const useLastNotificationResponse = jest.fn(() => undefined);
