import type { AnySQLiteSelect } from 'drizzle-orm/sqlite-core';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useMemo, useState, type DependencyList } from 'react';

import { withDatabaseSpan } from '@/src/lib/db/database-observability';
import { scheduleIdleTask } from '@/src/lib/utils/schedule-idle-task.utils';

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
  isLoading: boolean;
  isLive: boolean;
};

interface UseLiveWithFallbackOptions<Rows extends unknown[]> {
  operation?: string;
  enabled?: boolean;
  fallbackData?: Rows;
  initialData?: Rows;
  deferInitialRead?: boolean;
  waitForInteractions?: boolean;
  debugLabel?: string;
}

const activeDebugSubscriptions = new Map<string, number>();
const debugQueryRuns = new Map<string, number>();

export function useLiveWithFallback<Query extends LiveRowsQuery>(
  query: Query,
  deps: DependencyList,
  options?: UseLiveWithFallbackOptions<QueryRows<Query>>
): UseLiveWithFallbackResult<QueryRows<Query>> {
  const {
    enabled = true,
    operation,
    fallbackData,
    initialData,
    deferInitialRead = false,
    waitForInteractions = false,
    debugLabel
  } = options ?? {};
  const fallbackRows = (fallbackData ?? initialData ?? []) as QueryRows<Query>;

  const initialRows = useMemo(() => {
    if (!enabled || deferInitialRead) {
      return fallbackRows;
    }

    if (!operation) {
      return query.all() as QueryRows<Query>;
    }

    return withDatabaseSpan(
      {
        operation,
        feature: operation.split('.')[0],
        access: 'read',
        phase: 'initial_read',
        liveRefresh: false
      },
      () => query.all() as QueryRows<Query>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  const [liveRows, setLiveRows] = useState<QueryRows<Query>>(initialRows);
  const [updatedAt, setUpdatedAt] = useState<Date>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (!enabled) {
      setLiveRows(fallbackRows);
      setUpdatedAt(undefined);
      setError(undefined);

      return;
    }

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

    if (__DEV__ && debugLabel) {
      const activeCount = (activeDebugSubscriptions.get(debugLabel) ?? 0) + 1;

      activeDebugSubscriptions.set(debugLabel, activeCount);

      if (activeCount > 1) {
        console.warn(
          `[live-query:${debugLabel}] ${activeCount} active subscriptions`
        );
      }
    }

    const watchedTableNames = new Set(getUsedTables.call(query));

    const runQuery = () => {
      const currentRequestId = ++requestId;

      if (__DEV__ && debugLabel) {
        const runCount = (debugQueryRuns.get(debugLabel) ?? 0) + 1;

        debugQueryRuns.set(debugLabel, runCount);

        if (process.env.EXPO_PUBLIC_DEBUG_LIVE_QUERIES === '1') {
          // eslint-disable-next-line no-console
          console.debug(`[live-query:${debugLabel}] run ${runCount}`);
        }
      }

      const liveQuery = operation
        ? withDatabaseSpan(
            {
              operation,
              feature: operation.split('.')[0],
              access: 'read',
              phase: 'live_refresh',
              liveRefresh: true
            },
            () =>
              new Promise<QueryRows<Query>>((resolve, reject) => {
                query.then(rows => resolve(rows as QueryRows<Query>), reject);
              })
          )
        : query.then(rows => rows as QueryRows<Query>);

      liveQuery.then(
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

    const cancelScheduledInitialRun = waitForInteractions
      ? scheduleIdleTask(runQuery)
      : undefined;

    if (!waitForInteractions) {
      runQuery();
    }

    const listener = addDatabaseChangeListener(({ tableName }) => {
      if (watchedTableNames.has(tableName)) {
        runQuery();
      }
    });

    return () => {
      isCurrent = false;
      cancelScheduledInitialRun?.();
      listener.remove();

      if (__DEV__ && debugLabel) {
        const activeCount = activeDebugSubscriptions.get(debugLabel) ?? 1;

        if (activeCount <= 1) {
          activeDebugSubscriptions.delete(debugLabel);
          debugQueryRuns.delete(debugLabel);
        } else {
          activeDebugSubscriptions.set(debugLabel, activeCount - 1);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const isLive = enabled && Boolean(updatedAt);
  const isLoading = enabled && deferInitialRead && !isLive && !error;

  return {
    data: isLive ? liveRows : initialRows,
    updatedAt: enabled ? updatedAt : undefined,
    error: enabled ? error : undefined,
    isLoading,
    isLive
  };
}
