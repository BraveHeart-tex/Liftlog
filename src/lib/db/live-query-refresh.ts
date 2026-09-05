type RefreshListener = () => void;

const listeners = new Set<RefreshListener>();
let refreshVersion = 0;

export function getLiveQueryRefreshVersion(): number {
  return refreshVersion;
}

export function subscribeToLiveQueryRefresh(listener: RefreshListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Invalidates every mounted database read after a multi-table restore. */
export function refreshLiveQueries(): void {
  refreshVersion += 1;

  for (const listener of listeners) {
    listener();
  }
}
