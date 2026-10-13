import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import {
  SESSION_COOKIE,
  githubProfile,
  readSession,
  sessionCookieOptions,
  signSession,
  type GitHubProfile,
  type UpsertUserInput,
} from './auth';
import type { SearchCache } from './cache';
import type { GatewayConfig } from './config';
import { classifyGrpcCode, grpcCode } from './errors';
import type { HotelClient, User } from './hotels';
import { resolvers } from './resolvers';
import { typeDefs } from './schema';

const DEMO_USER = {
  githubId: 'mock-avery-lane',
  email: 'avery.lane@marlow.demo',
  name: 'Avery Lane',
  avatarUrl: '',
};

export type AppDeps = {
  config: GatewayConfig;
  hotels: HotelClient;
  cache: SearchCache;
};

export async function createApp(deps: AppDeps): Promise<express.Express> {
  const { config, hotels, cache } = deps;
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    includeStacktraceInErrorResponses: false,
  });
  await apollo.start();

  const app = express();
  app.use(cors({ origin: config.webOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/auth/config', (_req, res) => {
    res.json(config.auth);
  });

  app.post('/auth/mock', asyncRoute(async (_req, res) => {
    if (!config.auth.mock) {
      res.status(404).json({ error: 'Demo sign-in is disabled' });
      return;
    }
    const user = await hotels.upsertUser(DEMO_USER);
    res.cookie(SESSION_COOKIE, signSession(user.id, config.jwtSecret), sessionCookieOptions(config.cookieSecure));
    res.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl });
  }));

  app.post('/auth/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions(config.cookieSecure));
    res.status(204).end();
  });

  if (config.auth.github) {
    passport.use(new GitHubStrategy({
      clientID: config.githubClientId,
      clientSecret: config.githubClientSecret,
      callbackURL: config.githubCallbackUrl,
    }, (
      accessToken: string,
      refreshToken: string,
      profile: GitHubProfile,
      done: (error: unknown, user?: UpsertUserInput) => void,
    ) => {
      void accessToken;
      void refreshToken;
      done(null, githubProfile(profile));
    }));
    app.use(passport.initialize());
    app.get('/auth/github', passport.authenticate('github', { scope: ['read:user', 'user:email'], session: false }));
    app.get('/auth/github/callback', (req, res, next) => {
      passport.authenticate('github', { session: false }, (error: unknown, profile: UpsertUserInput | false) => {
        if (error || !profile) {
          res.redirect(`${config.publicWebUrl}/?auth=failed`);
          return;
        }
        hotels.upsertUser(profile).then((user) => {
          res.cookie(SESSION_COOKIE, signSession(user.id, config.jwtSecret), sessionCookieOptions(config.cookieSecure));
          res.redirect(config.publicWebUrl);
        }).catch(next);
      })(req, res, next);
    });
  }

  app.use('/graphql', expressMiddleware(apollo, {
    context: async ({ req }) => ({
      user: await loadUser(req.cookies?.[SESSION_COOKIE], config.jwtSecret, hotels),
      hotels,
      cache,
      searchCacheTtlSeconds: config.searchCacheTtlSeconds,
    }),
  }));

  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Unexpected error' });
  });

  return app;
}

async function loadUser(token: string | undefined, secret: string, hotels: HotelClient): Promise<User | null> {
  const userId = readSession(token, secret);
  if (!userId) {
    return null;
  }
  try {
    return await hotels.getUser(userId);
  } catch (error) {
    if (classifyGrpcCode(grpcCode(error)) === 'not_found') {
      return null;
    }
    throw error;
  }
}

function asyncRoute(handler: (req: Request, res: Response) => Promise<void>): express.RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}
