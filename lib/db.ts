import { Pool, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function databasePoolConfig() {
  return {
    max: Number(process.env.PG_POOL_MAX || 20),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5000),
    maxUses: Number(process.env.PG_MAX_USES || 7500),
    statementTimeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 15000)
  };
}

export function db() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ...databasePoolConfig()
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
  return db().query<T>(sql, params);
}

export function databasePoolStats() {
  if (!pool) {
    return {
      initialized: false,
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0,
      config: databasePoolConfig()
    };
  }

  return {
    initialized: true,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    config: databasePoolConfig()
  };
}
