const HOTEL_FIELDS = `
  id
  slug
  name
  city
  country
  neighborhood
  description
  amenities
  pricePerNight
  currency
  rating
  reviewCount
  imageUrl
  rooms { id name beds maxGuests pricePerNight }
`;

export const ME_QUERY = `
  query Me {
    me { id name email avatarUrl }
  }
`;

export const HOTELS_QUERY = `
  query Hotels($query: String, $checkIn: String, $checkOut: String, $guests: Int, $maxPrice: Int) {
    hotels(query: $query, checkIn: $checkIn, checkOut: $checkOut, guests: $guests, maxPrice: $maxPrice) {
      total
      cached
      hotels { ${HOTEL_FIELDS} }
    }
  }
`;

export const HOTEL_QUERY = `
  query Hotel($id: ID!) {
    hotel(id: $id) { ${HOTEL_FIELDS} }
  }
`;

export const BOOKINGS_QUERY = `
  query Bookings {
    bookings {
      id
      checkIn
      checkOut
      guests
      totalPrice
      currency
      status
      createdAt
      room { id name beds maxGuests pricePerNight }
      hotel { ${HOTEL_FIELDS} }
    }
  }
`;

export const CREATE_BOOKING = `
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      checkIn
      checkOut
      guests
      totalPrice
      currency
      status
      createdAt
      room { id name beds maxGuests pricePerNight }
      hotel { ${HOTEL_FIELDS} }
    }
  }
`;

export const CANCEL_BOOKING = `
  mutation CancelBooking($id: ID!) {
    cancelBooking(id: $id) {
      id
      status
    }
  }
`;
