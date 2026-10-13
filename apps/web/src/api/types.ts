export type Room = {
  id: string;
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
  name: string;
  email: string;
  avatarUrl: string;
};

export type Booking = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency: string;
  status: string;
  createdAt: string;
  hotel: Hotel;
  room: Room;
};

export type HotelSearchResult = {
  hotels: Hotel[];
  total: number;
  cached: boolean;
};

export type AuthConfig = {
  mock: boolean;
  github: boolean;
};

export type SearchCriteria = {
  query: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  maxPrice: number | null;
};

export type CreateBookingInput = {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};
