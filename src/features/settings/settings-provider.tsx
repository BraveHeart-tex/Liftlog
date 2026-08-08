import { useDrizzle } from '@/src/components/database-provider';
import {
  addRestTimerPreset as addRestTimerPresetRepo,
  deleteRestTimerPreset as deleteRestTimerPresetRepo,
  getSettingsQuery,
  getSettingsSnapshot,
  mapSettingsRows,
  setHealthConnectStepsEnabled as setHealthConnectStepsEnabledRepo,
  setRestTimerDuration as setRestTimerDurationRepo,
  setStepGoal as setStepGoalRepo,
  setWeightUnit as setWeightUnitRepo,
  updateRestTimerPreset as updateRestTimerPresetRepo,
  type RestTimerPreset,
  type WeightUnit
} from '@/src/features/settings/settings.repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { getTimerParts } from '@/src/lib/utils/date.utils';
import { pluralize } from '@/src/lib/utils/string.utils';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo
} from 'react';

interface SettingsContextValue {
  weightUnit: WeightUnit;
  restTimerDuration: number;
  restTimerPresets: RestTimerPreset[];
  formattedRestTimerDuration: string;
  healthConnectStepsEnabled: boolean;
  stepGoal: number;
  setWeightUnit: (unit: WeightUnit) => void;
  setRestTimerDuration: (seconds: number) => void;
  addRestTimerPreset: (preset: Omit<RestTimerPreset, 'id'>) => void;
  updateRestTimerPreset: (preset: RestTimerPreset) => void;
  deleteRestTimerPreset: (id: string) => void;
  setHealthConnectStepsEnabled: (isEnabled: boolean) => void;
  setStepGoal: (goal: number) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: PropsWithChildren) {
  const db = useDrizzle();
  const initialSettings = useMemo(() => getSettingsSnapshot(db), [db]);
  const { data: rows, isLive } = useLiveWithFallback(
    getSettingsQuery(db),
    [db],
    { deferInitialRead: true, debugLabel: 'settings' }
  );
  const liveSettings = useMemo(() => mapSettingsRows(rows), [rows]);
  const settings = isLive ? liveSettings : initialSettings;

  const setWeightUnit = useCallback(
    (unit: WeightUnit) => {
      setWeightUnitRepo(db, unit);
    },
    [db]
  );

  const setRestTimerDuration = useCallback(
    (seconds: number) => {
      setRestTimerDurationRepo(db, seconds);
    },
    [db]
  );

  const addRestTimerPreset = useCallback(
    (preset: Omit<RestTimerPreset, 'id'>) => {
      addRestTimerPresetRepo(db, preset);
    },
    [db]
  );

  const updateRestTimerPreset = useCallback(
    (preset: RestTimerPreset) => {
      updateRestTimerPresetRepo(db, preset);
    },
    [db]
  );

  const deleteRestTimerPreset = useCallback(
    (id: string) => {
      deleteRestTimerPresetRepo(db, id);
    },
    [db]
  );

  const setHealthConnectStepsEnabled = useCallback(
    (isEnabled: boolean) => {
      setHealthConnectStepsEnabledRepo(db, isEnabled);
    },
    [db]
  );

  const setStepGoal = useCallback(
    (goal: number) => {
      setStepGoalRepo(db, goal);
    },
    [db]
  );

  const formattedRestTimerDuration = useMemo(() => {
    if (!settings.restTimerDuration) {
      return '';
    }

    const { minutes, seconds } = getTimerParts(settings.restTimerDuration);

    return [
      minutes > 0 ? pluralize(minutes, 'minute') : null,
      seconds > 0 ? pluralize(seconds, 'second') : null
    ]
      .filter(Boolean)
      .join(' ');
  }, [settings.restTimerDuration]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      formattedRestTimerDuration,
      setWeightUnit,
      setRestTimerDuration,
      addRestTimerPreset,
      updateRestTimerPreset,
      deleteRestTimerPreset,
      setHealthConnectStepsEnabled,
      setStepGoal
    }),
    [
      addRestTimerPreset,
      deleteRestTimerPreset,
      formattedRestTimerDuration,
      setHealthConnectStepsEnabled,
      setRestTimerDuration,
      setStepGoal,
      settings,
      setWeightUnit,
      updateRestTimerPreset
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
}
