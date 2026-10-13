export type HotelConfig = {
  databaseUrl: string;
  grpcHost: string;
  grpcPort: number;
  healthPort: number;
};

export function hotelConfig(env: NodeJS.ProcessEnv): HotelConfig {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  return {
    databaseUrl,
    grpcHost: env.GRPC_HOST ?? '0.0.0.0',
    grpcPort: Number(env.GRPC_PORT ?? 50051),
    healthPort: Number(env.HEALTH_PORT ?? 8081),
  };
}
