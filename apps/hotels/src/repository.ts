import { status } from '@grpc/grpc-js';
import type { Pool, PoolClient } from 'pg';
import {
  type Booking,
  type Hotel,
  type Room,
  type User,
  parseBookingStatus,
} from './domain';
import { ServiceError } from './errors';
import { assertGuestCount, assertDateRange, isUuid, quoteTotal } from './pricing';
import { buildHotelSearch, normalizeSearch, validateSearch, type SearchInput } from './search';

type HotelRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  neighborhood: string;
  description: string;
  amenities: string[];
  price_per_night: number;
  currency: string;
  rating: string;
  review_count: number;
  image_url: string;
};

type RoomRow = {
  id: string;
  hotel_id: string;
  name: string;
  beds: string;
  max_guests: number;
  price_per_night: number;
};

type UserRow = {
  id: string;
  github_id: string;
  email: string;
  name: string;
  avatar_url: string;
};

type BookingRow = {
  id: string;
  user_id: string;
  hotel_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  currency: string;
  status: string;
  created_at: Date;
};

const HOTEL_COLUMNS = `h.id, h.slug, h.name, h.city, h.country, h.neighborhood, h.description,
  h.amenities, h.price_per_night, h.currency, h.rating, h.review_count, h.image_url`;

const ROOM_COLUMNS = `r.id, r.hotel_id, r.name, r.beds, r.max_guests, r.price_per_night`;

export function createRepository(pool: Pool) {
  return {
    searchHotels(input: SearchInput): Promise<Hotel[]> {
      const normalized = normalizeSearch(input);
      validateSearch(normalized);
      return searchHotels(pool, normalized);
    },
    getHotel(id: string): Promise<Hotel> {
      return getHotel(pool, id);
    },
    createBooking(input: {
      userId: string;
      hotelId: string;
      roomId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
    }): Promise<Booking> {
      return createBooking(pool, input);
    },
    listBookings(userId: string): Promise<Booking[]> {
      return listBookings(pool, userId);
    },
    cancelBooking(userId: string, bookingId: string): Promise<Booking> {
      return cancelBooking(pool, userId, bookingId);
    },
    upsertUser(input: { githubId: string; email: string; name: string; avatarUrl: string }): Promise<User> {
      return upsertUser(pool, input);
    },
    getUser(id: string): Promise<User> {
      return getUser(pool, id);
    },
  };
}

export type HotelRepository = ReturnType<typeof createRepository>;

async function searchHotels(pool: Pool, input: SearchInput): Promise<Hotel[]> {
  const query = buildHotelSearch(input);
  const result = await pool.query<HotelRow>(query.text, query.values);
  return attachRooms(pool, result.rows);
}

async function getHotel(pool: Pool, id: string): Promise<Hotel> {
  if (!isUuid(id)) {
    throw new ServiceError(status.NOT_FOUND, 'Hotel not found');
  }
  const result = await pool.query<HotelRow>(
    `SELECT ${HOTEL_COLUMNS} FROM hotels h WHERE h.id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) {
    throw new ServiceError(status.NOT_FOUND, 'Hotel not found');
  }
  const [hotel] = await attachRooms(pool, [row]);
  if (!hotel) {
    throw new ServiceError(status.NOT_FOUND, 'Hotel not found');
  }
  return hotel;
}

async function attachRooms(pool: Pool, rows: HotelRow[]): Promise<Hotel[]> {
  if (rows.length === 0) {
    return [];
  }
  const ids = rows.map((row) => row.id);
  const rooms = await pool.query<RoomRow>(
    `SELECT ${ROOM_COLUMNS}
     FROM rooms r
     WHERE r.hotel_id = ANY($1::uuid[])
     ORDER BY r.price_per_night ASC, r.name ASC`,
    [ids],
  );
  const byHotel = new Map<string, Room[]>();
  for (const room of rooms.rows) {
    const list = byHotel.get(room.hotel_id) ?? [];
    list.push(mapRoom(room));
    byHotel.set(room.hotel_id, list);
  }
  return rows.map((row) => mapHotel(row, byHotel.get(row.id) ?? []));
}

async function createBooking(
  pool: Pool,
  input: {
    userId: string;
    hotelId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  },
): Promise<Booking> {
  if (!isUuid(input.userId) || !isUuid(input.hotelId) || !isUuid(input.roomId)) {
    throw new ServiceError(status.INVALID_ARGUMENT, 'Booking references are invalid');
  }
  assertGuestCount(input.guests);
  const nights = assertDateRange(input.checkIn, input.checkOut);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    try {
      const roomResult = await client.query<RoomRow & { currency: string }>(
        `SELECT ${ROOM_COLUMNS}, h.currency
         FROM rooms r
         JOIN hotels h ON h.id = r.hotel_id
         WHERE r.id = $1 AND r.hotel_id = $2
         FOR UPDATE`,
        [input.roomId, input.hotelId],
      );
      const room = roomResult.rows[0];
      if (!room) {
        throw new ServiceError(status.NOT_FOUND, 'Room not found');
      }
      if (input.guests > room.max_guests) {
        throw new ServiceError(status.INVALID_ARGUMENT, `This room sleeps ${room.max_guests}`);
      }

      const overlap = await client.query(
        `SELECT 1
         FROM bookings
         WHERE room_id = $1
           AND status = 'confirmed'
           AND check_in < $3::date
           AND check_out > $2::date
         FOR UPDATE`,
        [input.roomId, input.checkIn, input.checkOut],
      );
      if (overlap.rowCount) {
        throw new ServiceError(status.FAILED_PRECONDITION, 'Those dates are already held');
      }

      const inserted = await client.query<BookingRow>(
        `INSERT INTO bookings (
           user_id, hotel_id, room_id, check_in, check_out, guests, total_price, currency, status
         ) VALUES ($1, $2, $3, $4::date, $5::date, $6, $7, $8, 'confirmed')
         RETURNING id, user_id, hotel_id, room_id, check_in::text, check_out::text,
                   guests, total_price, currency, status, created_at`,
        [
          input.userId,
          input.hotelId,
          input.roomId,
          input.checkIn,
          input.checkOut,
          input.guests,
          quoteTotal(room.price_per_night, nights),
          room.currency,
        ],
      );
      const bookingRow = inserted.rows[0];
      if (!bookingRow) {
        throw new ServiceError(status.INTERNAL, 'Booking was not stored');
      }
      const booking = await loadBooking(client, bookingRow);
      await client.query('COMMIT');
      return booking;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    client.release();
  }
}

async function listBookings(pool: Pool, userId: string): Promise<Booking[]> {
  if (!isUuid(userId)) {
    throw new ServiceError(status.NOT_FOUND, 'User not found');
  }
  const result = await pool.query<BookingRow>(
    `SELECT id, user_id, hotel_id, room_id, check_in::text, check_out::text,
            guests, total_price, currency, status, created_at
     FROM bookings
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  const bookings: Booking[] = [];
  for (const row of result.rows) {
    bookings.push(await loadBooking(pool, row));
  }
  return bookings;
}

async function cancelBooking(pool: Pool, userId: string, bookingId: string): Promise<Booking> {
  if (!isUuid(userId) || !isUuid(bookingId)) {
    throw new ServiceError(status.NOT_FOUND, 'Booking not found');
  }
  const updated = await pool.query<BookingRow>(
    `UPDATE bookings
     SET status = 'cancelled'
     WHERE id = $1 AND user_id = $2 AND status = 'confirmed'
     RETURNING id, user_id, hotel_id, room_id, check_in::text, check_out::text,
               guests, total_price, currency, status, created_at`,
    [bookingId, userId],
  );
  const row = updated.rows[0];
  if (row) {
    return loadBooking(pool, row);
  }

  const existing = await pool.query<BookingRow>(
    `SELECT id, user_id, hotel_id, room_id, check_in::text, check_out::text,
            guests, total_price, currency, status, created_at
     FROM bookings
     WHERE id = $1 AND user_id = $2`,
    [bookingId, userId],
  );
  const current = existing.rows[0];
  if (!current) {
    throw new ServiceError(status.NOT_FOUND, 'Booking not found');
  }
  return loadBooking(pool, current);
}

async function loadBooking(db: Pool | PoolClient, row: BookingRow): Promise<Booking> {
  const hotelResult = await db.query<HotelRow>(
    `SELECT ${HOTEL_COLUMNS} FROM hotels h WHERE h.id = $1`,
    [row.hotel_id],
  );
  const hotelRow = hotelResult.rows[0];
  const roomsResult = await db.query<RoomRow>(
    `SELECT ${ROOM_COLUMNS}
     FROM rooms r
     WHERE r.hotel_id = $1
     ORDER BY r.price_per_night ASC, r.name ASC`,
    [row.hotel_id],
  );
  const roomRow = roomsResult.rows.find((room) => room.id === row.room_id);
  if (!hotelRow || !roomRow) {
    throw new ServiceError(status.INTERNAL, 'Booking is missing its hotel');
  }
  return {
    id: row.id,
    userId: row.user_id,
    hotelId: row.hotel_id,
    roomId: row.room_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    totalPrice: row.total_price,
    currency: row.currency,
    status: parseBookingStatus(row.status),
    createdAt: new Date(row.created_at).toISOString(),
    hotel: mapHotel(hotelRow, roomsResult.rows.map(mapRoom)),
    room: mapRoom(roomRow),
  };
}

async function upsertUser(
  pool: Pool,
  input: { githubId: string; email: string; name: string; avatarUrl: string },
): Promise<User> {
  if (!input.githubId || !input.name) {
    throw new ServiceError(status.INVALID_ARGUMENT, 'A name and GitHub id are required');
  }
  const result = await pool.query<UserRow>(
    `INSERT INTO users (github_id, email, name, avatar_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (github_id) DO UPDATE
       SET email = EXCLUDED.email,
           name = EXCLUDED.name,
           avatar_url = EXCLUDED.avatar_url
     RETURNING id, github_id, email, name, avatar_url`,
    [input.githubId, input.email, input.name, input.avatarUrl],
  );
  const row = result.rows[0];
  if (!row) {
    throw new ServiceError(status.INTERNAL, 'User was not stored');
  }
  return mapUser(row);
}

async function getUser(pool: Pool, id: string): Promise<User> {
  if (!isUuid(id)) {
    throw new ServiceError(status.NOT_FOUND, 'User not found');
  }
  const result = await pool.query<UserRow>(
    `SELECT id, github_id, email, name, avatar_url FROM users WHERE id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) {
    throw new ServiceError(status.NOT_FOUND, 'User not found');
  }
  return mapUser(row);
}

function mapHotel(row: HotelRow, rooms: Room[]): Hotel {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    country: row.country,
    neighborhood: row.neighborhood,
    description: row.description,
    amenities: row.amenities,
    pricePerNight: row.price_per_night,
    currency: row.currency,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    imageUrl: row.image_url,
    rooms,
  };
}

function mapRoom(row: RoomRow): Room {
  return {
    id: row.id,
    hotelId: row.hotel_id,
    name: row.name,
    beds: row.beds,
    maxGuests: row.max_guests,
    pricePerNight: row.price_per_night,
  };
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    githubId: row.github_id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
  };
}
