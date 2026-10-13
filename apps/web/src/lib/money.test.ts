import { describe, expect, it } from 'vitest';
import { formatMoney, initials } from './money';

describe('money', () => {
  it('formats whole dollars', () => {
    expect(formatMoney(180)).toBe('$180');
    expect(formatMoney(260, 'USD')).toBe('$260');
  });

  it('builds initials from a name', () => {
    expect(initials('Avery Lane')).toBe('AL');
  });
});
