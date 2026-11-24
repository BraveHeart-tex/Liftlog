// react-native-health-connect loads under Jest but every call needs the native
// module. This mock covers the names the app imports; tests override individual
// functions with jest.mocked(...).
export { SdkAvailabilityStatus } from 'react-native-health-connect/src/constants';

export const getSdkStatus = jest.fn(async () => 1);

export const initialize = jest.fn(async () => true);

export const openHealthConnectSettings = jest.fn();

export const requestPermission = jest.fn(async () => []);

export const getGrantedPermissions = jest.fn(async () => []);

export const aggregateGroupByPeriod = jest.fn(async () => []);
