CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id text NOT NULL UNIQUE,
  email text NOT NULL DEFAULT '',
  name text NOT NULL,
  avatar_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  neighborhood text NOT NULL,
  description text NOT NULL,
  amenities text[] NOT NULL,
  price_per_night integer NOT NULL CHECK (price_per_night > 0),
  currency text NOT NULL DEFAULT 'USD',
  rating numeric(2, 1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  review_count integer NOT NULL CHECK (review_count >= 0),
  image_url text NOT NULL
);

CREATE INDEX hotels_city_idx ON hotels (city);

CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels (id) ON DELETE CASCADE,
  name text NOT NULL,
  beds text NOT NULL,
  max_guests integer NOT NULL CHECK (max_guests > 0),
  price_per_night integer NOT NULL CHECK (price_per_night > 0),
  UNIQUE (hotel_id, name)
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id),
  hotel_id uuid NOT NULL REFERENCES hotels (id),
  room_id uuid NOT NULL REFERENCES rooms (id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL CHECK (guests BETWEEN 1 AND 8),
  total_price integer NOT NULL CHECK (total_price > 0),
  currency text NOT NULL,
  status text NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);

CREATE INDEX bookings_room_active_idx ON bookings (room_id, check_in, check_out)
  WHERE status = 'confirmed';

CREATE INDEX bookings_user_idx ON bookings (user_id, created_at DESC);
