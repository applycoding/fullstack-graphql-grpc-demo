import { status } from '@grpc/grpc-js';
import { ServiceError } from './errors';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NIGHTS = 30;

export function assertDateRange(checkIn: string, checkOut: string): number {
  if (!ISO_DATE.test(checkIn) || !ISO_DATE.test(checkOut)) {
    throw new ServiceError(status.INVALID_ARGUMENT, 'Dates must use YYYY-MM-DD');
  }
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new ServiceError(status.INVALID_ARGUMENT, 'Dates must use YYYY-MM-DD');
  }
  const nights = Math.round((end - start) / 86_400_000);
  if (nights < 1) {
    throw new ServiceError(status.INVALID_ARGUMENT, 'Checkout must be after check-in');
  }
  if (nights > MAX_NIGHTS) {
    throw new ServiceError(status.INVALID_ARGUMENT, 'Stays are limited to 30 nights');
  }
  return nights;
}

export function assertGuestCount(guests: number): void {
  if (!Number.isInteger(guests) || guests < 1 || guests > 8) {
    throw new ServiceError(status.INVALID_ARGUMENT, 'Guests must be between 1 and 8');
  }
}

export function quoteTotal(pricePerNight: number, nights: number): number {
  return pricePerNight * nights;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}
