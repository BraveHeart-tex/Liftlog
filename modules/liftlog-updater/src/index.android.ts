import { requireNativeModule } from 'expo';
import type { LiftlogUpdaterApi } from '@/modules/liftlog-updater/src/types';

export * from '@/modules/liftlog-updater/src/types';

export const LiftlogUpdater =
  requireNativeModule<LiftlogUpdaterApi>('LiftlogUpdater');
