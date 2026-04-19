import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import type { AnySQLiteSelect } from 'drizzle-orm/sqlite-core';
import { useMemo, type DependencyList } from 'react';

export type LiveRowsQuery<T> = Pick<AnySQLiteSelect, '_' | 'then'> &
  PromiseLike<T[]>;

export type UseLiveWithFallbackResult<T> = {
  data: T[];
  updatedAt: Date | undefined;
  error: Error | undefined;
  isLive: boolean;
};

export function useLiveWithFallback<T, Query extends LiveRowsQuery<T>>(
  queryFn: () => Query,
  initialFn: () => T[],
  deps: DependencyList
): UseLiveWithFallbackResult<T> {
  // Callers own the dependency list so query and fallback stay in lockstep.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const query = useMemo(queryFn, deps);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialRows = useMemo(initialFn, deps);
  const {
    data: liveRows = [],
    updatedAt,
    error
  } = useLiveQuery(query, [...deps]);
  const isLive = Boolean(updatedAt);

  return {
    data: isLive ? liveRows : initialRows,
    updatedAt,
    error,
    isLive
  };
}
