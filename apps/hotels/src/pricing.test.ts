import { status } from '@grpc/grpc-js';
import { describe, expect, it } from 'vitest';
import { ServiceError } from './errors';
import { assertDateRange, assertGuestCount, isUuid, quoteTotal } from './pricing';

describe('stay pricing', () => {
  it('counts nights between two ISO dates', () => {
    expect(assertDateRange('2026-11-01', '2026-11-04')).toBe(3);
    expect(quoteTotal(180, 3)).toBe(540);
  });

  it('rejects impossible stays', () => {
    expect(() => assertDateRange('2026-11-04', '2026-11-04')).toThrow(ServiceError);
    expect(() => assertDateRange('2026-11-01', '2026-12-15')).toThrow(/30 nights/);
    expect(() => assertDateRange('11/01/2026', '2026-11-04')).toThrow(/YYYY-MM-DD/);
  });

  it('allows one night and a 30 night stay', () => {
    expect(assertDateRange('2026-11-01', '2026-11-02')).toBe(1);
    expect(assertDateRange('2026-11-01', '2026-12-01')).toBe(30);
  });

  it('limits guests to 1 through 8', () => {
    expect(() => assertGuestCount(0)).toThrow(ServiceError);
    expect(() => assertGuestCount(9)).toThrow(ServiceError);
    expect(() => assertGuestCount(1.5)).toThrow(ServiceError);
    assertGuestCount(8);
  });

  it('uses the grpc invalid-argument code for bad dates', () => {
    try {
      assertDateRange('2026-11-04', '2026-11-01');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect((error as ServiceError).code).toBe(status.INVALID_ARGUMENT);
    }
  });

  it('recognizes uuids', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
  });
});
