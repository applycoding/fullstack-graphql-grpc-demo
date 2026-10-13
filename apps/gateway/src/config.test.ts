import { describe, expect, it } from 'vitest';
import { authFlags, gatewayConfig, parseAuthMode } from './config';

const base = {
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'secret',
};

describe('auth mode', () => {
  it('defaults to mock and names the other modes', () => {
    expect(parseAuthMode(undefined)).toBe('mock');
    expect(authFlags('mock')).toEqual({ mock: true, github: false });
    expect(authFlags('github')).toEqual({ mock: false, github: true });
    expect(authFlags('both')).toEqual({ mock: true, github: true });
  });

  it('rejects an unknown mode', () => {
    expect(() => parseAuthMode('password')).toThrow(/AUTH_MODE/);
  });
});

describe('gatewayConfig', () => {
  it('requires redis, a jwt secret, and github credentials when that mode is on', () => {
    expect(() => gatewayConfig({ JWT_SECRET: 'secret' })).toThrow(/REDIS_URL/);
    expect(() => gatewayConfig({ REDIS_URL: 'redis://localhost:6379' })).toThrow(/JWT_SECRET/);
    expect(() => gatewayConfig({ ...base, AUTH_MODE: 'github' })).toThrow(/GITHUB_CLIENT_ID/);
    expect(gatewayConfig(base).auth).toEqual({ mock: true, github: false });
  });
});
