import path from 'path';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { gatewayConfig } from './config';
import { createHotelClient } from './hotels';
import { protoPath } from './paths';
import { createRedisCache } from './cache';
import { createApp } from './server';

dotenv.config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });
dotenv.config({ quiet: true });

async function main(): Promise<void> {
  const config = gatewayConfig(process.env);
  const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 2 });
  await redis.ping();
  const hotels = createHotelClient(config.hotelsGrpcAddr, protoPath());
  await hotels.waitForReady(15_000);
  const app = await createApp({ config, hotels, cache: createRedisCache(redis) });
  const server = app.listen(config.port, () => {
    const modes = [config.auth.mock ? 'mock' : null, config.auth.github ? 'github' : null].filter(Boolean).join(', ');
    console.log(`GraphQL gateway listening on ${config.port} (auth: ${modes})`);
  });

  const shutdown = () => {
    server.close(() => {
      hotels.close();
      redis.disconnect();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
