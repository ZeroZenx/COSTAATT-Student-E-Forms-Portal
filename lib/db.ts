import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

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

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await db().connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      // Preserve the original database error.
    }
    throw error;
  } finally {
    client.release();
  }
}

const REFERENCE_DATA_LOCK_KEY = "734982145";

export async function withReferenceDataWriteTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  return withTransaction(async (client) => {
    await client.query("select pg_advisory_xact_lock($1::bigint)", [REFERENCE_DATA_LOCK_KEY]);
    return work(client);
  });
}

/**
 * Coordinates operations that create or persist references to reference data
 * with reference-data writes. The shared lock is held only for the database
 * transaction, never while an administrator reviews a preview.
 */
export async function withReferenceDataSharedLockTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  return withTransaction(async (client) => {
    await client.query("select pg_advisory_xact_lock_shared($1::bigint)", [REFERENCE_DATA_LOCK_KEY]);
    return work(client);
  });
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
