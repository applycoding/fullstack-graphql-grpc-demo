export type AuthMode = 'mock' | 'github' | 'both';

export type AuthFlags = {
  mock: boolean;
  github: boolean;
};

export type GatewayConfig = {
  port: number;
  hotelsGrpcAddr: string;
  redisUrl: string;
  jwtSecret: string;
  auth: AuthFlags;
  publicWebUrl: string;
  webOrigin: string;
  githubClientId: string;
  githubClientSecret: string;
  githubCallbackUrl: string;
  cookieSecure: boolean;
  searchCacheTtlSeconds: number;
};

export function parseAuthMode(value: string | undefined): AuthMode {
  switch (value) {
    case undefined:
    case '':
    case 'mock':
      return 'mock';
    case 'github':
      return 'github';
    case 'both':
      return 'both';
    default:
      throw new Error('AUTH_MODE must be mock, github, or both');
  }
}

export function authFlags(mode: AuthMode): AuthFlags {
  switch (mode) {
    case 'mock':
      return { mock: true, github: false };
    case 'github':
      return { mock: false, github: true };
    case 'both':
      return { mock: true, github: true };
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}

export function gatewayConfig(env: NodeJS.ProcessEnv): GatewayConfig {
  const redisUrl = env.REDIS_URL;
  const jwtSecret = env.JWT_SECRET;
  if (!redisUrl) {
    throw new Error('REDIS_URL is required');
  }
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required');
  }
  const auth = authFlags(parseAuthMode(env.AUTH_MODE));
  const githubClientId = env.GITHUB_CLIENT_ID ?? '';
  const githubClientSecret = env.GITHUB_CLIENT_SECRET ?? '';
  const githubCallbackUrl = env.GITHUB_CALLBACK_URL ?? '';
  if (auth.github && (!githubClientId || !githubClientSecret || !githubCallbackUrl)) {
    throw new Error('GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_CALLBACK_URL are required for GitHub sign-in');
  }
  return {
    port: Number(env.PORT ?? 4000),
    hotelsGrpcAddr: env.HOTELS_GRPC_ADDR ?? 'localhost:50051',
    redisUrl,
    jwtSecret,
    auth,
    publicWebUrl: env.PUBLIC_WEB_URL ?? 'http://localhost:5173',
    webOrigin: env.WEB_ORIGIN ?? 'http://localhost:5173',
    githubClientId,
    githubClientSecret,
    githubCallbackUrl,
    cookieSecure: env.COOKIE_SECURE === 'true',
    searchCacheTtlSeconds: Number(env.SEARCH_CACHE_TTL_SECONDS ?? 60),
  };
}
