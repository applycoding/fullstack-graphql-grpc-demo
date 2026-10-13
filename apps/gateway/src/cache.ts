import type Redis from 'ioredis';

export type SearchCache = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  invalidate(): Promise<void>;
};

export type SearchKeyInput = {
  query: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  maxPrice: number;
};

export function searchCacheKey(input: SearchKeyInput): string {
  const parts = [
    input.query.trim().toLowerCase(),
    input.checkIn,
    input.checkOut,
    String(input.guests),
    String(input.maxPrice),
  ];
  return `marlow:search:v1:${parts.join('|')}`;
}

export function createRedisCache(client: Redis): SearchCache {
  return {
    async get(key) {
      return client.get(key);
    },
    async set(key, value, ttlSeconds) {
      await client.set(key, value, 'EX', ttlSeconds);
    },
    async invalidate() {
      let cursor = '0';
      do {
        const [next, keys] = await client.scan(cursor, 'MATCH', 'marlow:search:v1:*', 'COUNT', 100);
        cursor = next;
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== '0');
    },
  };
}

export function createMemoryCache(): SearchCache {
  const store = new Map<string, string>();
  return {
    async get(key) {
      return store.get(key) ?? null;
    },
    async set(key, value) {
      store.set(key, value);
    },
    async invalidate() {
      for (const key of store.keys()) {
        if (key.startsWith('marlow:search:v1:')) {
          store.delete(key);
        }
      }
    },
  };
}
