declare module 'sql.js' {
  export interface QueryExecResult {
    columns: string[]
    values: unknown[][]
  }

  export class Statement {
    bind(params?: unknown[] | Record<string, unknown>): boolean
    step(): boolean
    get(params?: unknown[]): unknown[]
    getAsObject(params?: Record<string, unknown>): Record<string, unknown>
    getColumnNames(): string[]
    free(): boolean
    reset(): void
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer | null)
    run(sql: string, params?: unknown[] | Record<string, unknown>): Database
    exec(sql: string, params?: unknown[] | Record<string, unknown>): QueryExecResult[]
    prepare(sql: string, params?: unknown[] | Record<string, unknown>): Statement
    each(
      sql: string,
      params: unknown[] | Record<string, unknown>,
      callback: (row: Record<string, unknown>) => void,
      done: () => void,
    ): Database
    export(): Uint8Array
    close(): void
    getRowsModified(): number
    create_function(name: string, func: (...args: unknown[]) => unknown): void
    create_aggregate(
      name: string,
      functions: {
        init?: () => unknown
        step: (state: unknown, ...values: unknown[]) => unknown
        finalize?: (state: unknown) => unknown
      },
    ): void
  }

  export interface SqlJsStatic {
    Database: typeof Database
    Statement: typeof Statement
  }

  export interface SqlJsConfig {
    locateFile?: (filename: string) => string
  }

  function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>

  export default initSqlJs
}
