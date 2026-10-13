import { readdir, readFile } from 'fs/promises';
import path from 'path';
import type { Pool, PoolClient } from 'pg';

export async function migrate(pool: Pool, dir: string): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(dir)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const existing = await pool.query('SELECT 1 FROM schema_migrations WHERE id = $1', [file]);
    if (existing.rowCount) {
      continue;
    }
    const sql = await readFile(path.join(dir, file), 'utf8');
    await withTransaction(pool, async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
    });
  }
}

export async function seed(pool: Pool, file: string): Promise<void> {
  const sql = await readFile(file, 'utf8');
  await pool.query(sql);
}

async function withTransaction(pool: Pool, work: (client: PoolClient) => Promise<void>): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    try {
      await work(client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    client.release();
  }
}
