import { GraphQLError } from 'graphql';
import type { SearchCache } from './cache';
import { searchCacheKey } from './cache';
import { asGraphqlError } from './errors';
import type { Hotel, HotelClient, SearchInput, User } from './hotels';

export type GraphQLContext = {
  user: User | null;
  hotels: HotelClient;
  cache: SearchCache;
  searchCacheTtlSeconds: number;
};

type HotelArgs = {
  query?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number | null;
  maxPrice?: number | null;
};

type CreateBookingArgs = {
  input: {
    hotelId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
};

export function normalizeSearchArgs(args: HotelArgs): SearchInput {
  return {
    query: args.query?.trim() ?? '',
    checkIn: args.checkIn?.trim() ?? '',
    checkOut: args.checkOut?.trim() ?? '',
    guests: args.guests ?? 0,
    maxPrice: args.maxPrice ?? 0,
  };
}

function requireUser(user: User | null): User {
  if (!user) {
    throw new GraphQLError('Sign in to hold a room', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return user;
}

async function fromService<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    throw asGraphqlError(error);
  }
}

export const resolvers = {
  Query: {
    hotels: async (_parent: unknown, args: HotelArgs, context: GraphQLContext) => {
      const input = normalizeSearchArgs(args);
      const key = searchCacheKey(input);
      const hit = await context.cache.get(key);
      if (hit) {
        const hotels = JSON.parse(hit) as Hotel[];
        return { hotels, total: hotels.length, cached: true };
      }
      const result = await fromService(() => context.hotels.searchHotels(input));
      await context.cache.set(key, JSON.stringify(result.hotels), context.searchCacheTtlSeconds);
      return { hotels: result.hotels, total: result.total, cached: false };
    },
    hotel: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      try {
        return await context.hotels.getHotel(args.id);
      } catch (error) {
        const graphqlError = asGraphqlError(error);
        if (graphqlError.extensions.code === 'NOT_FOUND') {
          return null;
        }
        throw graphqlError;
      }
    },
    me: (_parent: unknown, _args: unknown, context: GraphQLContext) => context.user,
    bookings: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireUser(context.user);
      return fromService(() => context.hotels.listBookings(user.id));
    },
  },
  Mutation: {
    createBooking: async (_parent: unknown, args: CreateBookingArgs, context: GraphQLContext) => {
      const user = requireUser(context.user);
      const booking = await fromService(() =>
        context.hotels.createBooking({
          userId: user.id,
          hotelId: args.input.hotelId,
          roomId: args.input.roomId,
          checkIn: args.input.checkIn,
          checkOut: args.input.checkOut,
          guests: args.input.guests,
        }),
      );
      await context.cache.invalidate();
      return booking;
    },
    cancelBooking: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      const user = requireUser(context.user);
      const booking = await fromService(() => context.hotels.cancelBooking(user.id, args.id));
      await context.cache.invalidate();
      return booking;
    },
  },
};
