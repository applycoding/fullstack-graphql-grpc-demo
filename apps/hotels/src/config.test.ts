import { describe, expect, it } from 'vitest';
import { hotelConfig } from './config';

describe('hotelConfig', () => {
  it('reads the database url and applies port defaults', () => {
    expect(hotelConfig({ DATABASE_URL: 'postgres://marlow:marlow@localhost:5432/marlow' })).toEqual({
      databaseUrl: 'postgres://marlow:marlow@localhost:5432/marlow',
      grpcHost: '0.0.0.0',
      grpcPort: 50051,
      healthPort: 8081,
    });
  });

  it('refuses to start without a database url', () => {
    expect(() => hotelConfig({})).toThrow(/DATABASE_URL/);
  });
});
