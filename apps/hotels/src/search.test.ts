import { describe, expect, it } from 'vitest';
import { ServiceError } from './errors';
import { buildHotelSearch, normalizeSearch, validateSearch } from './search';

const base = {
  query: 'Kyoto',
  maxPrice: 0,
  guests: 2,
  checkIn: '2026-11-01',
  checkOut: '2026-11-04',
};

describe('hotel search', () => {
  it('trims and caps the query', () => {
    const normalized = normalizeSearch({ ...base, query: '  Kyoto  ' });
    expect(normalized.query).toBe('Kyoto');
    expect(normalizeSearch({ ...base, query: 'x'.repeat(120) }).query).toHaveLength(80);
  });

  it('requires both dates when one is present', () => {
    expect(() => validateSearch({ ...base, checkOut: '' })).toThrow(ServiceError);
    expect(() => validateSearch({ ...base, maxPrice: -1 })).toThrow(/negative/);
  });

  it('filters by price and availability only when those inputs are set', () => {
    const dated = buildHotelSearch(base);
    expect(dated.text).toContain('h.price_per_night');
    expect(dated.text).not.toContain('price_per_night <=');
    expect(dated.text).toContain("b.status = 'confirmed'");
    expect(dated.text).toContain('b.check_in <');
    expect(dated.text).toContain('b.check_out >');
    expect(dated.values).toEqual(['Kyoto', 2, '2026-11-01', '2026-11-04']);

    const priced = buildHotelSearch({ ...base, maxPrice: 200, checkIn: '', checkOut: '', guests: 0 });
    expect(priced.text).toContain('price_per_night <=');
    expect(priced.text).not.toContain('bookings');
    expect(priced.values).toEqual(['Kyoto', 200, 1]);
  });
});
