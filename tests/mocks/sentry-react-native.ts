// The real @sentry/react-native starts an un-unref'd interval on import that keeps
// Jest workers alive. This mock covers the names the app imports; tests override
// individual functions with jest.mocked(...).
import type { Span } from '@sentry/react-native';

const span = { setStatus: jest.fn() } as unknown as Span;

export const startSpan = jest.fn(
  <T>(_options: unknown, callback: (activeSpan: Span) => T): T => callback(span)
);

export const captureException = jest.fn(() => 'event-id');

export const captureMessage = jest.fn(() => 'event-id');

export const init = jest.fn();

export const wrap = jest.fn(<T>(component: T): T => component);

export const expoRouterIntegration = jest.fn(() => ({ name: 'ExpoRouter' }));

export const reactNativeTracingIntegration = jest.fn(() => ({
  name: 'ReactNativeTracing'
}));
