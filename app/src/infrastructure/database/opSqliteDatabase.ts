import type { DB, Scalar } from '@op-engineering/op-sqlite';
import type {
  SqlDatabase,
  SqlExecutor,
  SqlResult,
  SqlRow,
  SqlValue,
} from './sqlDatabase';

type RawExecutor = {
  execute: (
    query: string,
    params?: Scalar[],
  ) => Promise<{ rows: Array<Record<string, Scalar>>; rowsAffected: number }>;
};

function toSqlValue(value: Scalar): SqlValue {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return value;
}

function toRows(rows: Array<Record<string, Scalar>>): SqlRow[] {
  return rows.map(row => {
    const converted: SqlRow = {};
    for (const [column, value] of Object.entries(row)) {
      converted[column] = toSqlValue(value);
    }
    return converted;
  });
}

function wrap(raw: RawExecutor): SqlExecutor {
  return {
    async execute(sql, params = []): Promise<SqlResult> {
      const result = await raw.execute(sql, params as Scalar[]);
      return { rows: toRows(result.rows), rowsAffected: result.rowsAffected };
    },
  };
}

export function createOpSqliteDatabase(database: DB): SqlDatabase {
  const executor = wrap(database);
  return {
    execute: executor.execute,
    async transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
      let result: T | undefined;
      await database.transaction(async tx => {
        result = await work(wrap(tx));
      });
      return result as T;
    },
    close() {
      database.close();
    },
  };
}
