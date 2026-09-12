import { createRestTimerSnapshotStore } from '@/src/features/rest-timer/rest-timer-runtime-snapshot';
import { createMMKV } from 'react-native-mmkv';

const restTimerRuntimeStorage = createMMKV({
  id: 'liftlog.runtime.rest-timer',
  compareBeforeSet: true
});

export const restTimerSnapshotStore = createRestTimerSnapshotStore(
  restTimerRuntimeStorage
);
