import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Hotel } from '../api/types';
import { HotelCard } from './HotelCard';

const hotel: Hotel = {
  id: 'kiri',
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

describe('HotelCard', () => {
  it('links the house, city, and nightly price', () => {
    render(
      <MemoryRouter>
        <HotelCard hotel={hotel} priority />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Kiri House' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Kiri House/ })).toHaveAttribute('href', '/hotels/kiri');
    expect(screen.getByText('$260')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Gion, Kyoto/ })).toBeInTheDocument();
  });
});
