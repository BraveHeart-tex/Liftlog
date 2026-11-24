import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync
} from 'node:sqlite';

// expo-sqlite's synchronous client surface over node:sqlite, enough for Drizzle
// and its migrator to run against real SQLite in tests.

// Jest runs tests in a vm realm, but node:sqlite creates rows and errors in
// Node's own realm. Copying them into this realm keeps deepStrictEqual and
// instanceof Error behaving as they do with expo-sqlite on device.
function toLocalRows<T extends object>(rows: T[]): T[] {
  return Array.from(rows, row => ({ ...row }));
}

function withLocalErrors<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof Error || typeof error !== 'object' || error === null) {
      throw error;
    }

    const { message, stack } = error as Error;

    throw Object.assign(new Error(message), error, { stack });
  }
}

class NodeSQLiteStatement {
  constructor(
    private readonly statement: StatementSync,
    private readonly database: DatabaseSync,
    private readonly onExecute: (params: SQLInputValue[]) => void
  ) {}

  executeSync(params: SQLInputValue[] = []) {
    return this.execute(params, false);
  }

  executeForRawResultSync(params: SQLInputValue[] = []) {
    return this.execute(params, true);
  }

  private execute(params: SQLInputValue[], rawResult: boolean) {
    this.onExecute(params);
    const rows = toLocalRows(
      withLocalErrors(() => this.statement.all(...params))
    );
    const metadata = this.database
      .prepare(
        'SELECT changes() AS changes, last_insert_rowid() AS lastInsertRowId'
      )
      .get();

    if (!metadata) {
      throw new Error('SQLite did not return statement metadata.');
    }

    return {
      changes: Number(metadata.changes),
      lastInsertRowId: Number(metadata.lastInsertRowId),
      getAllSync: () =>
        rawResult ? rows.map(row => Object.values(row)) : rows,
      getFirstSync: () => {
        const row = rows[0] ?? null;

        return rawResult && row ? Object.values(row) : row;
      }
    };
  }
}

export class NodeSQLiteDatabase {
  private readonly database = new DatabaseSync(':memory:');
  private executedPreparedStatementCount = 0;
  private recordedPreparedStatements:
    | { source: string; params: SQLInputValue[] }[]
    | undefined;

  get isOpen() {
    return this.database.isOpen;
  }

  getPreparedStatementCount() {
    return this.executedPreparedStatementCount;
  }

  resetPreparedStatementCount() {
    this.executedPreparedStatementCount = 0;
  }

  startRecordingPreparedStatements() {
    this.recordedPreparedStatements = [];
  }

  stopRecordingPreparedStatements() {
    const recordedPreparedStatements = this.recordedPreparedStatements ?? [];

    this.recordedPreparedStatements = undefined;

    return recordedPreparedStatements;
  }

  closeSync() {
    this.database.close();
  }

  execSync(source: string) {
    withLocalErrors(() => this.database.exec(source));
  }

  async execAsync(source: string) {
    this.execSync(source);
  }

  prepareSync(source: string) {
    return new NodeSQLiteStatement(
      withLocalErrors(() => this.database.prepare(source)),
      this.database,
      params => {
        if (!/^\s*(begin|commit|rollback)\b/i.test(source)) {
          this.executedPreparedStatementCount += 1;
        }

        this.recordedPreparedStatements?.push({
          source,
          params: [...params]
        });
      }
    );
  }

  getFirstSync<T>(source: string): T | null {
    const row = withLocalErrors(() => this.database.prepare(source).get());

    return row ? ({ ...row } as T) : null;
  }

  getAllSync<T>(source: string, params: SQLInputValue[] = []): T[] {
    return toLocalRows(
      withLocalErrors(() => this.database.prepare(source).all(...params))
    ) as T[];
  }

  async getFirstAsync<T>(source: string): Promise<T | null> {
    return this.getFirstSync<T>(source);
  }

  async getAllAsync<T>(source: string): Promise<T[]> {
    return this.getAllSync<T>(source);
  }
}
