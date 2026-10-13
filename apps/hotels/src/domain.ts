export type Room = {
  id: string;
  hotelId: string;
  name: string;
  beds: string;
  maxGuests: number;
  pricePerNight: number;
};

export type Hotel = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  neighborhood: string;
  description: string;
  amenities: string[];
  pricePerNight: number;
  currency: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  rooms: Room[];
};

export type User = {
  id: string;
  githubId: string;
  email: string;
  name: string;
  avatarUrl: string;
};

export type BookingStatus = 'confirmed' | 'cancelled';

export type Booking = {
  id: string;
  userId: string;
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
  hotel: Hotel;
  room: Room;
};

export function parseBookingStatus(value: string): BookingStatus {
  switch (value) {
    case 'confirmed':
    case 'cancelled':
      return value;
    default:
      throw new Error(`Unknown booking status: ${value}`);
  }
}
