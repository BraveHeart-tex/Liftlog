import type { AnySQLiteSelect } from 'drizzle-orm/sqlite-core';

type LiveQuery<TData> = Pick<AnySQLiteSelect, '_' | 'then'> & {
  config: {
    table: unknown;
  };
  then<TResult1 = TData, TResult2 = never>(
    onfulfilled?: ((value: TData) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>;
};

export function createLiveQuery<TData>(
  table: unknown,
  getData: () => TData
): LiveQuery<TData> {
  return {
    _: undefined as unknown as AnySQLiteSelect['_'],
    config: {
      table
    },
    then(onfulfilled, onrejected) {
      return Promise.resolve().then(getData).then(onfulfilled, onrejected);
    }
  };
}
