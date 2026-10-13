export type BookingStatus = 'confirmed' | 'cancelled';

export function parseBookingStatus(value: string): BookingStatus | null {
  switch (value) {
    case 'confirmed':
    case 'cancelled':
      return value;
    default:
      return null;
  }
}

export function bookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmed';
    case 'cancelled':
      return 'Cancelled';
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
