import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

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
  status: string;
  createdAt: string;
  hotel: Hotel;
  room: Room;
};

export type SearchInput = {
  query: string;
  maxPrice: number;
  guests: number;
  checkIn: string;
  checkOut: string;
};

export type HotelClient = {
  searchHotels(input: SearchInput): Promise<{ hotels: Hotel[]; total: number }>;
  getHotel(id: string): Promise<Hotel>;
  createBooking(input: {
    userId: string;
    hotelId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }): Promise<Booking>;
  listBookings(userId: string): Promise<Booking[]>;
  cancelBooking(userId: string, bookingId: string): Promise<Booking>;
  upsertUser(input: { githubId: string; email: string; name: string; avatarUrl: string }): Promise<User>;
  getUser(id: string): Promise<User>;
  close(): void;
  waitForReady(timeoutMs: number): Promise<void>;
};

type Unary<TReq, TRes> = (request: TReq, callback: (error: grpc.ServiceError | null, response: TRes) => void) => void;

type RawClient = grpc.Client & {
  searchHotels: Unary<SearchInput, { hotels: Hotel[]; total: number }>;
  getHotel: Unary<{ id: string }, Hotel>;
  createBooking: Unary<
    { userId: string; hotelId: string; roomId: string; checkIn: string; checkOut: string; guests: number },
    Booking
  >;
  listBookings: Unary<{ userId: string }, { bookings: Booking[] }>;
  cancelBooking: Unary<{ userId: string; bookingId: string }, Booking>;
  upsertUser: Unary<{ githubId: string; email: string; name: string; avatarUrl: string }, User>;
  getUser: Unary<{ id: string }, User>;
};

type HotelServiceConstructor = {
  new (address: string, credentials: grpc.ChannelCredentials): RawClient;
};

type LoadedPackage = {
  marlow: {
    hotels: {
      v1: {
        HotelService: HotelServiceConstructor;
      };
    };
  };
};

function loadService(protoFile: string): HotelServiceConstructor {
  const definition = protoLoader.loadSync(protoFile, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const pkg = grpc.loadPackageDefinition(definition) as unknown as LoadedPackage;
  return pkg.marlow.hotels.v1.HotelService;
}

function unary<TReq, TRes>(method: Unary<TReq, TRes>, request: TReq): Promise<TRes> {
  return new Promise((resolve, reject) => {
    method(request, (error, response) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(response);
    });
  });
}

export function createHotelClient(address: string, protoFile: string): HotelClient {
  const HotelService = loadService(protoFile);
  const client = new HotelService(address, grpc.credentials.createInsecure());
  return {
    searchHotels: (input) => unary(client.searchHotels.bind(client), input),
    getHotel: (id) => unary(client.getHotel.bind(client), { id }),
    createBooking: (input) => unary(client.createBooking.bind(client), input),
    listBookings: async (userId) => (await unary(client.listBookings.bind(client), { userId })).bookings,
    cancelBooking: (userId, bookingId) => unary(client.cancelBooking.bind(client), { userId, bookingId }),
    upsertUser: (input) => unary(client.upsertUser.bind(client), input),
    getUser: (id) => unary(client.getUser.bind(client), { id }),
    close: () => client.close(),
    waitForReady: (timeoutMs) =>
      new Promise((resolve, reject) => {
        client.waitForReady(Date.now() + timeoutMs, (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}
