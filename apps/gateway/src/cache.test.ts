import { describe, expect, it } from 'vitest';
import { createMemoryCache, searchCacheKey } from './cache';

describe('searchCacheKey', () => {
  it('is stable for equivalent queries and distinct when the stay changes', () => {
    const left = searchCacheKey({
      query: ' Kyoto ',
      checkIn: '2026-11-01',
      checkOut: '2026-11-04',
      guests: 2,
      maxPrice: 0,
    });
    const right = searchCacheKey({
      query: 'kyoto',
      checkIn: '2026-11-01',
      checkOut: '2026-11-04',
      guests: 2,
      maxPrice: 0,
    });
    expect(left).toBe(right);
    expect(left).not.toBe(searchCacheKey({
      query: 'kyoto',
      checkIn: '2026-12-01',
      checkOut: '2026-12-04',
      guests: 2,
      maxPrice: 0,
    }));
  });
});

describe('memory cache', () => {
  it('stores a value and drops search keys on invalidate', async () => {
    const cache = createMemoryCache();
    await cache.set('marlow:search:v1:kyoto', '[]', 60);
    await cache.set('other', 'keep', 60);
    expect(await cache.get('marlow:search:v1:kyoto')).toBe('[]');
    await cache.invalidate();
    expect(await cache.get('marlow:search:v1:kyoto')).toBeNull();
    expect(await cache.get('other')).toBe('keep');
  });
});
