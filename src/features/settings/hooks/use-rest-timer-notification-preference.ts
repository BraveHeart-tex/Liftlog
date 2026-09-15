import { showSnackbar } from '@/src/components/ui/snackbar';
import {
  getExactAlarmAccess,
  openExactAlarmSettings,
  openRestTimerNotificationChannelSettings
} from '@/src/features/rest-timer/rest-timer-exact-alarm';
import {
  cancelRestTimerNotification,
  getRestTimerNotificationPermission,
  openRestTimerNotificationSettings,
  requestRestTimerNotificationPermission
} from '@/src/features/rest-timer/rest-timer-notifications.service';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import {
  getRestTimerNotificationPreferenceState,
  type RestTimerNotificationPreferenceState
} from '@/src/features/rest-timer/rest-timer-notification-policy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';

export function useRestTimerNotificationPreference() {
  const { restTimerNotificationsEnabled, setRestTimerNotificationsEnabled } =
    useSettings();
  const [state, setState] = useState<RestTimerNotificationPreferenceState>(
    restTimerNotificationsEnabled ? 'Blocked' : 'Off'
  );
  const [isEnabling, setIsEnabling] = useState(false);
  const isEnablingRef = useRef(false);
  const [timingMayBeDelayed, setTimingMayBeDelayed] = useState(false);

  const refresh = useCallback(async () => {
    if (isEnablingRef.current) {
      return;
    }

    if (Platform.OS !== 'android' || !restTimerNotificationsEnabled) {
      setState('Off');
      setTimingMayBeDelayed(false);

      return;
    }

    try {
      const permission = await getRestTimerNotificationPermission();
      const exactAlarm = getExactAlarmAccess();
      setState(
        getRestTimerNotificationPreferenceState({
          enabled: true,
          enabling: false,
          permissionGranted: permission.granted
        })
      );
      setTimingMayBeDelayed(
        permission.granted && exactAlarm.supported && !exactAlarm.granted
      );
    } catch {
      setState('Blocked');
      setTimingMayBeDelayed(false);
      console.error('Failed to reconcile rest timer notification access');
    }
  }, [restTimerNotificationsEnabled]);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh]);

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        setRestTimerNotificationsEnabled(false);
        setState('Off');
        setTimingMayBeDelayed(false);

        try {
          await cancelRestTimerNotification();
        } catch {
          console.error('Failed to clear rest timer notifications');
        }

        return;
      }

      setRestTimerNotificationsEnabled(true);
      isEnablingRef.current = true;
      setIsEnabling(true);

      try {
        const granted = await requestRestTimerNotificationPermission();

        if (!granted) {
          setState('Blocked');

          return;
        }

        setState('On');
        const exactAlarm = getExactAlarmAccess();
        const isTimingDegraded = exactAlarm.supported && !exactAlarm.granted;
        setTimingMayBeDelayed(isTimingDegraded);

        if (isTimingDegraded) {
          Alert.alert(
            'Allow timely rest alerts?',
            'Alarms and reminders access helps Android deliver short rest timers close to their deadline.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Open settings', onPress: openExactAlarmSettings }
            ]
          );
        }
      } catch {
        console.error('Failed to enable rest timer notifications');
        setState('Blocked');
        showSnackbar({
          message: 'Could not enable rest timer notifications.',
          variant: 'danger'
        });
      } finally {
        isEnablingRef.current = false;
        setIsEnabling(false);
      }
    },
    [setRestTimerNotificationsEnabled]
  );

  const openNotificationSettings = useCallback(() => {
    if (state === 'On' && openRestTimerNotificationChannelSettings()) {
      return;
    }

    return openRestTimerNotificationSettings();
  }, [state]);

  return {
    enabled: restTimerNotificationsEnabled,
    state,
    isEnabling,
    timingMayBeDelayed,
    setEnabled,
    openNotificationSettings,
    openExactAlarmSettings
  };
}
