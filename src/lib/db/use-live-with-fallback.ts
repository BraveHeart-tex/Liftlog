import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import type { AnySQLiteSelect } from 'drizzle-orm/sqlite-core';
import { useMemo, type DependencyList } from 'react';

type LiveRowsQuery = Pick<AnySQLiteSelect, '_' | 'then'> &
  PromiseLike<unknown[]> & {
    all: () => unknown[];
  };

type QueryRows<Query extends LiveRowsQuery> = Query['_'] extends {
  result: infer Rows extends unknown[];
}
  ? Rows
  : Awaited<Query> extends infer Rows extends unknown[]
    ? Rows
    : never;

type UseLiveWithFallbackResult<Rows extends unknown[]> = {
  data: Rows;
  updatedAt: Date | undefined;
  error: Error | undefined;
  isLive: boolean;
};

export function useLiveWithFallback<Query extends LiveRowsQuery>(
  query: Query,
  deps: DependencyList
): UseLiveWithFallbackResult<QueryRows<Query>> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialRows = useMemo(() => query.all() as QueryRows<Query>, deps);
  const { data: liveRows, updatedAt, error } = useLiveQuery(query, [...deps]);
  const isLive = Boolean(updatedAt);

  return {
    data: isLive ? (liveRows as QueryRows<Query>) : initialRows,
    updatedAt,
    error,
    isLive
  };
}
