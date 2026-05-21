declare module 'sql.js' {
  interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  interface Database {
    run(sql: string, params?: unknown[]): void;
    exec(sql: string, params?: unknown[]): QueryExecResult[];
    export(): Uint8Array;
    close(): void;
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  interface InitSqlJsOptions {
    locateFile?: (file: string) => string;
  }

  export type { Database, QueryExecResult, SqlJsStatic };
  export default function initSqlJs(options?: InitSqlJsOptions): Promise<SqlJsStatic>;
}
