import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import type { Booking, Hotel, Room, User } from './domain';
import { ServiceError } from './errors';
import type { HotelRepository } from './repository';
import type { SearchInput } from './search';

type HotelServiceClient = grpc.Client & {
  searchHotels(
    request: SearchInput,
    callback: (error: grpc.ServiceError | null, response?: { hotels: Hotel[]; total: number }) => void,
  ): void;
  getHotel(
    request: { id: string },
    callback: (error: grpc.ServiceError | null, response?: Hotel) => void,
  ): void;
  createBooking(
    request: {
      userId: string;
      hotelId: string;
      roomId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
    },
    callback: (error: grpc.ServiceError | null, response?: Booking) => void,
  ): void;
  listBookings(
    request: { userId: string },
    callback: (error: grpc.ServiceError | null, response?: { bookings: Booking[] }) => void,
  ): void;
  cancelBooking(
    request: { userId: string; bookingId: string },
    callback: (error: grpc.ServiceError | null, response?: Booking) => void,
  ): void;
  upsertUser(
    request: { githubId: string; email: string; name: string; avatarUrl: string },
    callback: (error: grpc.ServiceError | null, response?: User) => void,
  ): void;
  getUser(
    request: { id: string },
    callback: (error: grpc.ServiceError | null, response?: User) => void,
  ): void;
};

type HotelServiceConstructor = {
  service: grpc.ServiceDefinition;
  new (address: string, credentials: grpc.ChannelCredentials): HotelServiceClient;
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

function loadHotelService(protoFile: string): HotelServiceConstructor {
  const definition = protoLoader.loadSync(protoFile, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  // proto-loader does not emit TypeScript types for the loaded package.
  const pkg = grpc.loadPackageDefinition(definition) as unknown as LoadedPackage;
  return pkg.marlow.hotels.v1.HotelService;
}

export function startGrpcServer(repo: HotelRepository, host: string, port: number, protoFile: string): grpc.Server {
  const HotelService = loadHotelService(protoFile);
  const server = new grpc.Server();
  server.addService(HotelService.service, {
    searchHotels: (
      call: grpc.ServerUnaryCall<SearchInput, { hotels: Hotel[]; total: number }>,
      callback: (error: grpc.ServiceError | null, response?: { hotels: Hotel[]; total: number }) => void,
    ) => {
      void handle(callback, async () => {
        const hotels = await repo.searchHotels(call.request);
        return { hotels, total: hotels.length };
      });
    },
    getHotel: (
      call: grpc.ServerUnaryCall<{ id: string }, Hotel>,
      callback: (error: grpc.ServiceError | null, response?: Hotel) => void,
    ) => {
      void handle(callback, () => repo.getHotel(call.request.id));
    },
    createBooking: (
      call: grpc.ServerUnaryCall<
        { userId: string; hotelId: string; roomId: string; checkIn: string; checkOut: string; guests: number },
        Booking
      >,
      callback: (error: grpc.ServiceError | null, response?: Booking) => void,
    ) => {
      void handle(callback, () => repo.createBooking(call.request));
    },
    listBookings: (
      call: grpc.ServerUnaryCall<{ userId: string }, { bookings: Booking[] }>,
      callback: (error: grpc.ServiceError | null, response?: { bookings: Booking[] }) => void,
    ) => {
      void handle(callback, async () => ({ bookings: await repo.listBookings(call.request.userId) }));
    },
    cancelBooking: (
      call: grpc.ServerUnaryCall<{ userId: string; bookingId: string }, Booking>,
      callback: (error: grpc.ServiceError | null, response?: Booking) => void,
    ) => {
      void handle(callback, () => repo.cancelBooking(call.request.userId, call.request.bookingId));
    },
    upsertUser: (
      call: grpc.ServerUnaryCall<{ githubId: string; email: string; name: string; avatarUrl: string }, User>,
      callback: (error: grpc.ServiceError | null, response?: User) => void,
    ) => {
      void handle(callback, () => repo.upsertUser(call.request));
    },
    getUser: (
      call: grpc.ServerUnaryCall<{ id: string }, User>,
      callback: (error: grpc.ServiceError | null, response?: User) => void,
    ) => {
      void handle(callback, () => repo.getUser(call.request.id));
    },
  });

  server.bindAsync(`${host}:${port}`, grpc.ServerCredentials.createInsecure(), (error, boundPort) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(`Hotel gRPC listening on ${host}:${boundPort}`);
  });
  return server;
}

function handle<T>(
  callback: (error: grpc.ServiceError | null, response?: T) => void,
  work: () => Promise<T>,
): void {
  work().then(
    (result) => callback(null, result),
    (error: unknown) => callback(toGrpcError(error)),
  );
}

function toGrpcError(error: unknown): grpc.ServiceError {
  if (error instanceof ServiceError) {
    return {
      name: 'ServiceError',
      message: error.message,
      code: error.code,
      details: error.message,
      metadata: new grpc.Metadata(),
    };
  }
  console.error(error);
  return {
    name: 'Error',
    message: 'Internal error',
    code: grpc.status.INTERNAL,
    details: 'Internal error',
    metadata: new grpc.Metadata(),
  };
}

export function createHotelClient(address: string, protoFile: string): HotelServiceClient {
  const HotelService = loadHotelService(protoFile);
  return new HotelService(address, grpc.credentials.createInsecure());
}

export function waitForClient(client: grpc.Client, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    client.waitForReady(Date.now() + timeoutMs, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export type { HotelServiceClient, Room };
