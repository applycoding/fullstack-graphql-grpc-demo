import { describe, expect, it } from 'vitest';
import { criteriaFromParams, formatIsoDate, nightsBetween } from './dates';

describe('dates', () => {
  it('formats a local calendar date', () => {
    expect(formatIsoDate(new Date(2026, 10, 2))).toBe('2026-11-02');
  });

  it('counts nights and rejects a same-day stay', () => {
    expect(nightsBetween('2026-11-01', '2026-11-04')).toBe(3);
    expect(nightsBetween('2026-11-04', '2026-11-04')).toBeNull();
    expect(nightsBetween('2026-11-01', '2027-01-15')).toBeNull();
  });

  it('reads search params over the fallback stay', () => {
    const fallback = {
      query: '',
      checkIn: '2026-11-01',
      checkOut: '2026-11-04',
      guests: 2,
      maxPrice: null,
    };
    expect(criteriaFromParams(new URLSearchParams('q=Kyoto&guests=4&maxPrice=300'), fallback)).toMatchObject({
      query: 'Kyoto',
      guests: 4,
      maxPrice: 300,
    });
  });
});
