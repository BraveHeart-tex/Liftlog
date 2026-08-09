import type { NewHealthStepDay } from '@/src/db/schema';
import {
  aggregateGroupByPeriod,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
  SdkAvailabilityStatus,
  type BackgroundAccessPermission,
  type Permission,
  type ReadHealthDataHistoryPermission
} from 'react-native-health-connect';
import { Platform } from 'react-native';
import {
  getRecentLocalDayRanges,
  getTodayDateKey
} from '@/src/features/steps/steps-date.utils';

export type HealthConnectAvailability =
  | 'available'
  | 'provider_update_required'
  | 'unavailable'
  | 'unsupported';

export interface StepPermissionState {
  canReadSteps: boolean;
  canReadBackground: boolean;
  canReadHistory: boolean;
}

export interface StepHealthConnectStatus {
  availability: HealthConnectAvailability;
  permissions: StepPermissionState;
}

export interface StepSyncResult extends StepHealthConnectStatus {
  days: NewHealthStepDay[];
  usedHistoryWindowDays: number;
}

const STEP_PERMISSION: Permission = {
  accessType: 'read',
  recordType: 'Steps'
};

const HISTORY_PERMISSION: ReadHealthDataHistoryPermission = {
  accessType: 'read',
  recordType: 'ReadHealthDataHistory'
};

const BACKGROUND_PERMISSION: BackgroundAccessPermission = {
  accessType: 'read',
  recordType: 'BackgroundAccessPermission'
};

const INITIAL_HISTORY_DAYS = 365;
const FALLBACK_HISTORY_DAYS = 30;
const REFRESH_HISTORY_DAYS = 8;

type GrantedPermission =
  | Permission
  | BackgroundAccessPermission
  | ReadHealthDataHistoryPermission;

function hasPermission(
  permissions: GrantedPermission[],
  permission: GrantedPermission
): boolean {
  return permissions.some(
    granted =>
      granted.accessType === permission.accessType &&
      granted.recordType === permission.recordType
  );
}

function toStepPermissionState(
  permissions: GrantedPermission[]
): StepPermissionState {
  return {
    canReadSteps: hasPermission(permissions, STEP_PERMISSION),
    canReadBackground: hasPermission(permissions, BACKGROUND_PERMISSION),
    canReadHistory: hasPermission(permissions, HISTORY_PERMISSION)
  };
}

async function initializeHealthConnect(): Promise<HealthConnectAvailability> {
  if (Platform.OS !== 'android') {
    return 'unsupported';
  }

  const status = await getSdkStatus();

  if (
    status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
  ) {
    return 'provider_update_required';
  }

  if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
    return 'unavailable';
  }

  const isInitialized = await initialize();

  return isInitialized ? 'available' : 'unavailable';
}

async function getGrantedStepPermissionState(): Promise<StepPermissionState> {
  const permissions = (await getGrantedPermissions()) as GrantedPermission[];

  return toStepPermissionState(permissions);
}

export async function getHealthConnectAvailability(): Promise<HealthConnectAvailability> {
  try {
    return await initializeHealthConnect();
  } catch (error) {
    console.error('Failed to initialize Health Connect', error);

    return 'unavailable';
  }
}

export async function getStepPermissionState(): Promise<StepPermissionState> {
  const availability = await initializeHealthConnect();

  if (availability !== 'available') {
    return {
      canReadSteps: false,
      canReadBackground: false,
      canReadHistory: false
    };
  }

  return getGrantedStepPermissionState();
}

export async function getStepHealthConnectStatus(): Promise<StepHealthConnectStatus> {
  const availability = await getHealthConnectAvailability();

  if (availability !== 'available') {
    return {
      availability,
      permissions: {
        canReadSteps: false,
        canReadBackground: false,
        canReadHistory: false
      }
    };
  }

  return {
    availability,
    permissions: await getGrantedStepPermissionState()
  };
}

export async function requestStepPermissions(): Promise<StepPermissionState> {
  const availability = await initializeHealthConnect();

  if (availability !== 'available') {
    return {
      canReadSteps: false,
      canReadBackground: false,
      canReadHistory: false
    };
  }

  const permissions = (await requestPermission([
    STEP_PERMISSION,
    HISTORY_PERMISSION,
    BACKGROUND_PERMISSION
  ])) as GrantedPermission[];

  return toStepPermissionState(permissions);
}

export function openStepHealthConnectSettings(): void {
  if (Platform.OS !== 'android') {
    return;
  }

  openHealthConnectSettings();
}

async function readDailyStepTotals(
  dayCount: number
): Promise<NewHealthStepDay[]> {
  const ranges = getRecentLocalDayRanges(dayCount);
  const firstRange = ranges[0];
  const lastRange = ranges.at(-1);

  if (!firstRange || !lastRange) {
    return [];
  }

  const result = await aggregateGroupByPeriod({
    recordType: 'Steps',
    timeRangeFilter: {
      operator: 'between',
      startTime: new Date(firstRange.startAt).toISOString(),
      endTime: new Date(lastRange.endAt).toISOString()
    },
    timeRangeSlicer: {
      period: 'DAYS',
      length: 1
    }
  });

  const stepsByDateKey = new Map<string, number>();

  for (const item of result) {
    const dateKey = getTodayDateKeyFromTimestamp(item.startTime);

    stepsByDateKey.set(dateKey, item.result.COUNT_TOTAL ?? 0);
  }

  const syncedAt = Date.now();

  return ranges.map(range => ({
    dateKey: range.dateKey,
    steps: stepsByDateKey.get(range.dateKey) ?? 0,
    startAt: range.startAt,
    endAt: range.endAt,
    syncedAt
  }));
}

function getTodayDateKeyFromTimestamp(timestamp: string): string {
  const time = new Date(timestamp).getTime();

  if (!Number.isFinite(time)) {
    return getTodayDateKey();
  }

  const date = new Date(time);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function syncStepDaysFromHealthConnect({
  isInitial
}: {
  isInitial: boolean;
}): Promise<StepSyncResult> {
  const status = await getStepHealthConnectStatus();

  if (status.availability !== 'available' || !status.permissions.canReadSteps) {
    return {
      ...status,
      days: [],
      usedHistoryWindowDays: 0
    };
  }

  const dayCount = isInitial
    ? status.permissions.canReadHistory
      ? INITIAL_HISTORY_DAYS
      : FALLBACK_HISTORY_DAYS
    : REFRESH_HISTORY_DAYS;

  return {
    ...status,
    days: await readDailyStepTotals(dayCount),
    usedHistoryWindowDays: dayCount
  };
}
