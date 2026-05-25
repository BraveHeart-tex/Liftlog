import { NativeModule, requireOptionalNativeModule } from 'expo';

export type StepCounterChangeEvent = {
  steps: number;
  healthConnectBaseline: number;
  liveDelta: number;
  sensorValue: number | null;
};

export type StepCounterErrorEvent = {
  message: string;
};

export type StepCounterSubscription = {
  remove(): void;
};

export type StepCounterApi = {
  start(healthConnectBaseline: number, stepGoal?: number): void;
  stop(): void;
  updateBaseline(healthConnectBaseline: number, stepGoal?: number): void;
  isAvailable(): boolean;
  hasActivityRecognitionPermission(): boolean;
  addStepCountListener(listener: (event: StepCounterChangeEvent) => void): StepCounterSubscription;
  addErrorListener(listener: (event: StepCounterErrorEvent) => void): StepCounterSubscription;
};

type ExpoStepCounterEvents = {
  onStepCountChanged: (event: StepCounterChangeEvent) => void;
  onStepCounterError: (event: StepCounterErrorEvent) => void;
};

declare class ExpoStepCounterModule extends NativeModule<ExpoStepCounterEvents> {
  start(healthConnectBaseline: number, stepGoal: number): void;
  stop(): void;
  updateBaseline(healthConnectBaseline: number, stepGoal: number): void;
  isStepCounterAvailable(): boolean;
  hasActivityRecognitionPermission(): boolean;
}

const ExpoStepCounter = requireOptionalNativeModule<ExpoStepCounterModule>('ExpoStepCounter');

const NOOP_SUBSCRIPTION: StepCounterSubscription = {
  remove() {
    return undefined;
  },
};

function normalizeStepCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function normalizeStepGoal(value: number | undefined): number {
  return Math.max(1, normalizeStepCount(value ?? 10000));
}

export const StepCounter: StepCounterApi = {
  start(healthConnectBaseline: number, stepGoal?: number) {
    ExpoStepCounter?.start(normalizeStepCount(healthConnectBaseline), normalizeStepGoal(stepGoal));
  },

  stop() {
    ExpoStepCounter?.stop();
  },

  updateBaseline(healthConnectBaseline: number, stepGoal?: number) {
    ExpoStepCounter?.updateBaseline(
      normalizeStepCount(healthConnectBaseline),
      normalizeStepGoal(stepGoal)
    );
  },

  isAvailable() {
    return ExpoStepCounter?.isStepCounterAvailable() ?? false;
  },

  hasActivityRecognitionPermission() {
    return ExpoStepCounter?.hasActivityRecognitionPermission() ?? false;
  },

  addStepCountListener(listener: (event: StepCounterChangeEvent) => void) {
    return ExpoStepCounter?.addListener('onStepCountChanged', listener) ?? NOOP_SUBSCRIPTION;
  },

  addErrorListener(listener: (event: StepCounterErrorEvent) => void) {
    return ExpoStepCounter?.addListener('onStepCounterError', listener) ?? NOOP_SUBSCRIPTION;
  },
};

export default StepCounter;
