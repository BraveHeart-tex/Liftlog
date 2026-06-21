const DEFAULT_IDLE_TIMEOUT_MS = 500;

export function scheduleIdleTask(
  callback: () => void,
  timeoutMs = DEFAULT_IDLE_TIMEOUT_MS
) {
  if (typeof globalThis.requestIdleCallback === 'function') {
    const handle = globalThis.requestIdleCallback(
      () => {
        callback();
      },
      { timeout: timeoutMs }
    );

    return () => {
      if (typeof globalThis.cancelIdleCallback === 'function') {
        globalThis.cancelIdleCallback(handle);
      }
    };
  }

  const timeoutId = setTimeout(callback, 0);

  return () => clearTimeout(timeoutId);
}
