import path from 'path';
import dotenv from 'dotenv';
import { hotelConfig } from './config';
import { createPool } from './db';
import { startGrpcServer } from './grpc';
import { startHealthServer } from './health';
import { migrate, seed } from './migrate';
import { migrationsDir, protoPath, seedFile } from './paths';
import { createRepository } from './repository';

dotenv.config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });
dotenv.config({ quiet: true });

async function main(): Promise<void> {
  const config = hotelConfig(process.env);
  const pool = createPool(config.databaseUrl);
  pool.on('error', (error) => {
    console.error('postgres pool error', error);
  });

  console.log('Waiting for Postgres');
  await waitForDatabase(pool);
  await migrate(pool, migrationsDir());
  await seed(pool, seedFile());

  const repo = createRepository(pool);
  const grpcServer = startGrpcServer(repo, config.grpcHost, config.grpcPort, protoPath());
  const healthServer = startHealthServer(config.healthPort);

  const shutdown = () => {
    healthServer.close();
    grpcServer.tryShutdown(() => {
      void pool.end().then(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

async function waitForDatabase(pool: ReturnType<typeof createPool>): Promise<void> {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      if (attempt === 30) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
