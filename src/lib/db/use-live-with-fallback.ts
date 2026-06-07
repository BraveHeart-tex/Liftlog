import type { AnySQLiteSelect } from 'drizzle-orm/sqlite-core';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useMemo, useState, type DependencyList } from 'react';

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
  const [liveRows, setLiveRows] = useState<QueryRows<Query>>(initialRows);
  const [updatedAt, setUpdatedAt] = useState<Date>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    const getUsedTables = (
      query as LiveRowsQuery & {
        getUsedTables?: () => string[];
      }
    ).getUsedTables;

    // getUsedTables is marked as @internal by drizzle, so we have to check its existence here
    if (!getUsedTables) {
      setError(new Error('Drizzle query does not expose getUsedTables()'));

      return;
    }

    let isCurrent = true;
    let requestId = 0;

    const watchedTableNames = new Set(getUsedTables.call(query));

    const runQuery = () => {
      const currentRequestId = ++requestId;

      query.then(
        rows => {
          if (!isCurrent || currentRequestId !== requestId) {
            return;
          }

          setLiveRows(rows as QueryRows<Query>);
          setError(undefined);
          setUpdatedAt(new Date());
        },
        queryError => {
          if (!isCurrent || currentRequestId !== requestId) {
            return;
          }

          setError(
            queryError instanceof Error
              ? queryError
              : new Error(String(queryError))
          );
        }
      );
    };

    runQuery();

    const listener = addDatabaseChangeListener(({ tableName }) => {
      if (watchedTableNames.has(tableName)) {
        runQuery();
      }
    });

    return () => {
      isCurrent = false;
      listener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const isLive = Boolean(updatedAt);

  return {
    data: isLive ? liveRows : initialRows,
    updatedAt,
    error,
    isLive
  };
}
