export type SqlValue = string | number | null | Uint8Array;

export type SqlRow = Record<string, SqlValue>;

export type SqlResult = {
  rows: SqlRow[];
  rowsAffected: number;
};

export interface SqlExecutor {
  execute(sql: string, params?: readonly SqlValue[]): Promise<SqlResult>;
}

export interface SqlDatabase extends SqlExecutor {
  transaction<T>(work: (executor: SqlExecutor) => Promise<T>): Promise<T>;
  close(): void;
}

export function readText(row: SqlRow, column: string): string {
  const value = row[column];
  if (typeof value !== 'string') {
    throw new TypeError(`column ${column} is not text`);
  }
  return value;
}

export function readOptionalText(row: SqlRow, column: string): string | null {
  const value = row[column];
  if (value === null || value === undefined) {
    return null;
  }
  return readText(row, column);
}

export function readInteger(row: SqlRow, column: string): number {
  const value = row[column];
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new TypeError(`column ${column} is not an integer`);
  }
  return value;
}

export function readOptionalInteger(
  row: SqlRow,
  column: string,
): number | null {
  const value = row[column];
  if (value === null || value === undefined) {
    return null;
  }
  return readInteger(row, column);
}

export function readBlob(row: SqlRow, column: string): Uint8Array {
  const value = row[column];
  if (!(value instanceof Uint8Array)) {
    throw new TypeError(`column ${column} is not a blob`);
  }
  return value;
}
