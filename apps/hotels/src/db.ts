import { Pool, types } from 'pg';

const PG_DATE = 1082;

types.setTypeParser(PG_DATE, (value) => value);

export function createPool(databaseUrl: string): Pool {
  return new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 3_000,
  });
}
