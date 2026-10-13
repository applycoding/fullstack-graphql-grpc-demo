import { status } from '@grpc/grpc-js';
import { ServiceError } from './errors';
import { assertDateRange, assertGuestCount } from './pricing';

export type SearchInput = {
  query: string;
  maxPrice: number;
  guests: number;
  checkIn: string;
  checkOut: string;
};

export function normalizeSearch(input: SearchInput): SearchInput {
  return {
    query: input.query.trim().slice(0, 80),
    maxPrice: input.maxPrice,
    guests: input.guests,
    checkIn: input.checkIn.trim(),
    checkOut: input.checkOut.trim(),
  };
}

export function validateSearch(input: SearchInput): void {
  if (!Number.isInteger(input.maxPrice) || input.maxPrice < 0) {
    throw new ServiceError(status.INVALID_ARGUMENT, 'Max price cannot be negative');
  }
  if (!Number.isInteger(input.guests) || input.guests < 0 || input.guests > 8) {
    throw new ServiceError(status.INVALID_ARGUMENT, 'Guests must be between 0 and 8');
  }
  const hasCheckIn = input.checkIn !== '';
  const hasCheckOut = input.checkOut !== '';
  if (hasCheckIn !== hasCheckOut) {
    throw new ServiceError(status.INVALID_ARGUMENT, 'Provide both dates, or leave both empty');
  }
  if (hasCheckIn && hasCheckOut) {
    assertDateRange(input.checkIn, input.checkOut);
  }
  if (input.guests > 0) {
    assertGuestCount(input.guests);
  }
}

export function buildHotelSearch(input: SearchInput): { text: string; values: unknown[] } {
  const values: unknown[] = [];
  const clauses: string[] = [];

  values.push(input.query);
  const queryParam = `$${values.length}`;
  clauses.push(`(
    ${queryParam} = ''
    OR h.city ILIKE '%' || ${queryParam} || '%'
    OR h.country ILIKE '%' || ${queryParam} || '%'
    OR h.neighborhood ILIKE '%' || ${queryParam} || '%'
    OR h.name ILIKE '%' || ${queryParam} || '%'
  )`);

  if (input.maxPrice > 0) {
    values.push(input.maxPrice);
    clauses.push(`h.price_per_night <= $${values.length}`);
  }

  const guestCount = input.guests > 0 ? input.guests : 1;
  values.push(guestCount);
  let roomMatch = `r.max_guests >= $${values.length}`;

  if (input.checkIn && input.checkOut) {
    values.push(input.checkIn);
    const checkInParam = `$${values.length}`;
    values.push(input.checkOut);
    const checkOutParam = `$${values.length}`;
    roomMatch += ` AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.room_id = r.id
        AND b.status = 'confirmed'
        AND b.check_in < ${checkOutParam}::date
        AND b.check_out > ${checkInParam}::date
    )`;
  }

  clauses.push(`EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.hotel_id = h.id
      AND ${roomMatch}
  )`);

  const text = `
    SELECT h.id, h.slug, h.name, h.city, h.country, h.neighborhood, h.description,
           h.amenities, h.price_per_night, h.currency, h.rating, h.review_count, h.image_url
    FROM hotels h
    WHERE ${clauses.join('\n AND ')}
    ORDER BY h.rating DESC, h.name ASC
  `;

  return { text, values };
}
