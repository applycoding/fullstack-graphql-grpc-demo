import type { CookieOptions } from 'express';
import jwt from 'jsonwebtoken';

export const SESSION_COOKIE = 'marlow_session';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type GitHubProfile = {
  id?: string;
  displayName?: string;
  username?: string;
  emails?: { value?: string }[];
  photos?: { value?: string }[];
};

export type UpsertUserInput = {
  githubId: string;
  email: string;
  name: string;
  avatarUrl: string;
};

export function signSession(userId: string, secret: string): string {
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
}

export function readSession(token: string | undefined, secret: string): string | null {
  if (!token) {
    return null;
  }
  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: WEEK_MS,
  };
}

export function githubProfile(profile: GitHubProfile): UpsertUserInput {
  const githubId = profile.id ?? '';
  const name = profile.displayName || profile.username || 'GitHub traveler';
  const email = profile.emails?.find((entry) => entry.value)?.value ?? '';
  const avatarUrl = profile.photos?.find((entry) => entry.value)?.value ?? '';
  return { githubId, email, name, avatarUrl };
}
