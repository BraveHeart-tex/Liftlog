import { appMeta } from '@/src/db/schema';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { like } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  closeTestDatabases,
  createMigratedTestDatabase
} from '@/tests/support/db';

type ChangeListener = (event: { tableName: string }) => void;

const changeListeners = new Set<ChangeListener>();

jest.doMock('expo-sqlite', () => ({
  ...jest.requireActual('expo-sqlite'),
  addDatabaseChangeListener: (listener: ChangeListener) => {
    changeListeners.add(listener);

    return { remove: () => changeListeners.delete(listener) };
  }
}));

// Not created by any migration, so reads of it fail with "no such table".
const missingTable = sqliteTable('missing_table', {
  id: text('id').primaryKey()
});

async function setup() {
  const { db } = await createMigratedTestDatabase();
  const { useLiveWithFallback } =
    await import('@/src/lib/db/use-live-with-fallback.hook');
  const { refreshLiveQueries } =
    await import('@/src/lib/db/live-query-refresh');
  const probeRows = () =>
    db.select().from(appMeta).where(like(appMeta.key, 'probe.%'));
  const insertProbe = (key: string) =>
    db
      .insert(appMeta)
      .values({ key: `probe.${key}`, value: key })
      .run();
  const emitChange = (tableName: string) =>
    act(async () => {
      for (const listener of changeListeners) {
        listener({ tableName });
      }
    });

  return {
    db,
    useLiveWithFallback,
    refreshLiveQueries,
    probeRows,
    insertProbe,
    emitChange
  };
}

afterEach(() => {
  changeListeners.clear();
  closeTestDatabases();
});

test('returns fallback rows until the first read, then live rows', async () => {
  const { useLiveWithFallback, probeRows, insertProbe } = await setup();
  const fallbackData = [{ key: 'fallback', value: 'fallback' }];

  insertProbe('a');

  const { result } = renderHook(() =>
    useLiveWithFallback(probeRows(), [], {
      deferInitialRead: true,
      fallbackData
    })
  );

  expect(result.current).toMatchObject({
    data: fallbackData,
    isLive: false,
    isLoading: true
  });

  await waitFor(() => expect(result.current.isLive).toBe(true));
  expect(result.current).toMatchObject({
    data: [{ key: 'probe.a', value: 'a' }],
    isLoading: false,
    error: undefined
  });
});

test('rereads only when a change event names a table the query uses', async () => {
  const { useLiveWithFallback, probeRows, insertProbe, emitChange } =
    await setup();
  const { result } = renderHook(() => useLiveWithFallback(probeRows(), []));

  await waitFor(() => expect(result.current.isLive).toBe(true));
  expect(result.current.data).toEqual([]);

  insertProbe('a');
  await emitChange('health_step_days');

  expect(result.current.data).toEqual([]);

  await emitChange('app_meta');

  expect(result.current.data).toEqual([{ key: 'probe.a', value: 'a' }]);
});

test('a live query refresh rereads the query', async () => {
  const { useLiveWithFallback, refreshLiveQueries, probeRows, insertProbe } =
    await setup();
  const { result } = renderHook(() =>
    useLiveWithFallback(probeRows(), [], { deferInitialRead: true })
  );

  await waitFor(() => expect(result.current.isLive).toBe(true));
  expect(result.current.data).toEqual([]);

  insertProbe('a');
  act(() => refreshLiveQueries());

  await waitFor(() =>
    expect(result.current.data).toEqual([{ key: 'probe.a', value: 'a' }])
  );
  expect(result.current.isLive).toBe(true);
});

test('stays idle on fallback rows while disabled', async () => {
  const { useLiveWithFallback, probeRows, insertProbe, emitChange } =
    await setup();
  const fallbackData = [{ key: 'fallback', value: 'fallback' }];

  insertProbe('a');

  const { result } = renderHook(() =>
    useLiveWithFallback(probeRows(), [], { enabled: false, fallbackData })
  );

  await emitChange('app_meta');

  expect(changeListeners.size).toBe(0);
  expect(result.current).toEqual({
    data: fallbackData,
    updatedAt: undefined,
    error: undefined,
    isLoading: false,
    isLive: false
  });
});

test('a failing query surfaces its error', async () => {
  const { db, useLiveWithFallback } = await setup();
  const { result } = renderHook(() =>
    useLiveWithFallback(db.select().from(missingTable), [], {
      deferInitialRead: true
    })
  );

  await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  expect(result.current.error?.message).toMatch(/no such table: missing_table/);
  expect(result.current).toMatchObject({ isLive: false, isLoading: false });
});
