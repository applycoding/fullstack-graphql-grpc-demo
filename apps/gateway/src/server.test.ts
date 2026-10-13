import { status } from '@grpc/grpc-js';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryCache } from './cache';
import { gatewayConfig } from './config';
import type { Hotel, HotelClient, User } from './hotels';
import { createApp } from './server';

const user: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  githubId: 'mock-avery-lane',
  email: 'avery.lane@marlow.demo',
  name: 'Avery Lane',
  avatarUrl: '',
};

const hotel: Hotel = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'kiri-house',
  name: 'Kiri House',
  city: 'Kyoto',
  country: 'Japan',
  neighborhood: 'Gion',
  description: 'Cedar and paper screens.',
  amenities: ['Garden'],
  pricePerNight: 260,
  currency: 'USD',
  rating: 4.9,
  reviewCount: 84,
  imageUrl: '/stays/kiri-house.svg',
  rooms: [],
};

function client(): HotelClient & { searches: number } {
  let searches = 0;
  return {
    async searchHotels() {
      searches += 1;
      return { hotels: [hotel], total: 1 };
    },
    async getHotel(id) {
      if (id === hotel.id) {
        return hotel;
      }
      throw Object.assign(new Error('Hotel not found'), { code: status.NOT_FOUND });
    },
    async createBooking() {
      throw Object.assign(new Error('Those dates are already held'), { code: status.FAILED_PRECONDITION });
    },
    async listBookings() {
      return [];
    },
    async cancelBooking() {
      throw Object.assign(new Error('Booking not found'), { code: status.NOT_FOUND });
    },
    async upsertUser() {
      return user;
    },
    async getUser(id) {
      if (id === user.id) {
        return user;
      }
      throw Object.assign(new Error('User not found'), { code: status.NOT_FOUND });
    },
    close() {},
    async waitForReady() {},
    get searches() {
      return searches;
    },
  };
}

async function appWith(hotels: HotelClient) {
  return createApp({
    config: gatewayConfig({
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-secret',
      AUTH_MODE: 'mock',
      PUBLIC_WEB_URL: 'http://localhost:5173',
    }),
    hotels,
    cache: createMemoryCache(),
  });
}

describe('gateway http', () => {
  let hotels: ReturnType<typeof client>;

  beforeEach(() => {
    hotels = client();
  });

  it('reports health and the mock auth mode', async () => {
    const app = await appWith(hotels);
    const health = await request(app).get('/health');
    expect(health.body).toEqual({ ok: true });
    const config = await request(app).get('/auth/config');
    expect(config.body).toEqual({ mock: true, github: false });
  });

  it('sets a session cookie and resolves me', async () => {
    const app = await appWith(hotels);
    const signedIn = await request(app).post('/auth/mock');
    expect(signedIn.body.name).toBe('Avery Lane');
    const cookie = signedIn.headers['set-cookie'];
    expect(cookie?.[0]).toContain('marlow_session');

    const me = await request(app)
      .post('/graphql')
      .set('Cookie', cookie ?? [])
      .send({ query: '{ me { name email } }' });
    expect(me.body.data.me).toEqual({ name: 'Avery Lane', email: 'avery.lane@marlow.demo' });
  });

  it('serves the second identical search from cache', async () => {
    const app = await appWith(hotels);
    const query = '{ hotels(query: "kyoto") { cached total hotels { name } } }';
    const first = await request(app).post('/graphql').send({ query });
    const second = await request(app).post('/graphql').send({ query });
    expect(first.body.data.hotels).toMatchObject({ cached: false, total: 1 });
    expect(second.body.data.hotels.cached).toBe(true);
    expect(hotels.searches).toBe(1);
  });

  it('refuses a booking without a session', async () => {
    const app = await appWith(hotels);
    const response = await request(app).post('/graphql').send({
      query: `mutation { createBooking(input: {
        hotelId: "${hotel.id}", roomId: "${hotel.id}", checkIn: "2026-11-01", checkOut: "2026-11-03", guests: 2
      }) { id } }`,
    });
    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });
});
