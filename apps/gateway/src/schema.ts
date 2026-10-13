export const typeDefs = `#graphql
  type Query {
    hotels(
      query: String
      checkIn: String
      checkOut: String
      guests: Int
      maxPrice: Int
    ): HotelSearchResult!
    hotel(id: ID!): Hotel
    me: User
    bookings: [Booking!]!
  }

  type Mutation {
    createBooking(input: CreateBookingInput!): Booking!
    cancelBooking(id: ID!): Booking!
  }

  type HotelSearchResult {
    hotels: [Hotel!]!
    total: Int!
    cached: Boolean!
  }

  type Hotel {
    id: ID!
    slug: String!
    name: String!
    city: String!
    country: String!
    neighborhood: String!
    description: String!
    amenities: [String!]!
    pricePerNight: Int!
    currency: String!
    rating: Float!
    reviewCount: Int!
    imageUrl: String!
    rooms: [Room!]!
  }

  type Room {
    id: ID!
    name: String!
    beds: String!
    maxGuests: Int!
    pricePerNight: Int!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    avatarUrl: String!
  }

  type Booking {
    id: ID!
    checkIn: String!
    checkOut: String!
    guests: Int!
    totalPrice: Int!
    currency: String!
    status: String!
    createdAt: String!
    hotel: Hotel!
    room: Room!
  }

  input CreateBookingInput {
    hotelId: ID!
    roomId: ID!
    checkIn: String!
    checkOut: String!
    guests: Int!
  }
`;
