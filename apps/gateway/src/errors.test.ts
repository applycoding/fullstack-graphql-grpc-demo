import { status } from '@grpc/grpc-js';
import { describe, expect, it } from 'vitest';
import { serviceMessage } from './errors';

describe('serviceMessage', () => {
  it('uses the grpc details instead of the coded status line', () => {
    expect(serviceMessage({
      message: '9 FAILED_PRECONDITION: Those dates are already held',
      details: 'Those dates are already held',
      code: status.FAILED_PRECONDITION,
    })).toBe('Those dates are already held');
  });

  it('strips a status prefix when details are missing', () => {
    expect(serviceMessage(new Error('3 INVALID_ARGUMENT: Checkout must be after check-in')))
      .toBe('Checkout must be after check-in');
  });
});
