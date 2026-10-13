import type { SearchCriteria } from '../api/types';

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function defaultStay(today = new Date()): { checkIn: string; checkOut: string } {
  return {
    checkIn: formatIsoDate(addDays(today, 14)),
    checkOut: formatIsoDate(addDays(today, 17)),
  };
}

export function nightsBetween(checkIn: string, checkOut: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    return null;
  }
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  const nights = Math.round((end - start) / 86_400_000);
  if (nights < 1 || nights > 30) {
    return null;
  }
  return nights;
}

export function formatStay(checkIn: string, checkOut: string): string {
  const formatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function criteriaFromParams(params: URLSearchParams, fallback: SearchCriteria): SearchCriteria {
  const guests = Number(params.get('guests'));
  const maxRaw = params.get('maxPrice');
  const maxPrice = maxRaw === null || maxRaw === '' ? fallback.maxPrice : Number(maxRaw);
  return {
    query: params.get('q') ?? fallback.query,
    checkIn: params.get('checkIn') ?? fallback.checkIn,
    checkOut: params.get('checkOut') ?? fallback.checkOut,
    guests: Number.isInteger(guests) && guests >= 1 && guests <= 8 ? guests : fallback.guests,
    maxPrice: maxPrice !== null && Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : null,
  };
}
