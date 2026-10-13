import { describe, expect, it } from 'vitest';
import type { Hotel } from '../api/types';
import { fetchHotels, searchReducer, setCriteria } from './searchSlice';

const hotel = {
  id: '1',
  slug: 'kiri-house',
  name: 'Kiri House',
  city: 'Kyoto',
  country: 'Japan',
  neighborhood: 'Gion',
  description: 'Cedar.',
  amenities: ['Garden'],
  pricePerNight: 260,
  currency: 'USD',
  rating: 4.9,
  reviewCount: 84,
  imageUrl: '/stays/kiri-house.svg',
  rooms: [],
} satisfies Hotel;

const criteria = {
  query: 'Kyoto',
  checkIn: '2026-11-01',
  checkOut: '2026-11-04',
  guests: 2,
  maxPrice: null,
};

describe('searchReducer', () => {
  it('keeps loaded stays when a single field changes', () => {
    const loaded = searchReducer(
      undefined,
      fetchHotels.fulfilled({ hotels: [hotel], total: 1, cached: true }, 'req', criteria),
    );
    const next = searchReducer(loaded, setCriteria({ query: 'Lisbon' }));
    expect(next.query).toBe('Lisbon');
    expect(next.hotels).toHaveLength(1);
    expect(next.cached).toBe(true);
  });

  it('records a failed search', () => {
    const next = searchReducer(undefined, fetchHotels.rejected(null, 'req', criteria, 'Search failed'));
    expect(next.status).toBe('failed');
    expect(next.error).toBe('Search failed');
  });
});
