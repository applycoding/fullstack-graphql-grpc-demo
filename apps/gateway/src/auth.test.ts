import { describe, expect, it } from 'vitest';
import { githubProfile, readSession, signSession } from './auth';

describe('session tokens', () => {
  it('round-trips a user id', () => {
    const token = signSession('user-1', 'secret');
    expect(readSession(token, 'secret')).toBe('user-1');
  });

  it('rejects a missing or forged token', () => {
    expect(readSession(undefined, 'secret')).toBeNull();
    expect(readSession('not-a-jwt', 'secret')).toBeNull();
    expect(readSession(signSession('user-1', 'secret'), 'other')).toBeNull();
  });
});

describe('githubProfile', () => {
  it('maps the passport profile onto the user record', () => {
    expect(githubProfile({
      id: '42',
      displayName: 'Arpan Bom',
      username: 'applycoding',
      emails: [{ value: 'applycoding@gmail.com' }],
      photos: [{ value: 'https://example.com/a.png' }],
    })).toEqual({
      githubId: '42',
      name: 'Arpan Bom',
      email: 'applycoding@gmail.com',
      avatarUrl: 'https://example.com/a.png',
    });
  });

  it('falls back when GitHub omits the display name and email', () => {
    expect(githubProfile({ id: '7', username: 'applycoding' })).toEqual({
      githubId: '7',
      name: 'applycoding',
      email: '',
      avatarUrl: '',
    });
  });
});
