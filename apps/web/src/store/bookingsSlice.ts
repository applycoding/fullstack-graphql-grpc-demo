import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { graphql } from '../api/client';
import { BOOKINGS_QUERY, CANCEL_BOOKING, CREATE_BOOKING } from '../api/queries';
import type { Booking, CreateBookingInput } from '../api/types';

type BookingsState = {
  items: Booking[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  saving: boolean;
};

const initialState: BookingsState = {
  items: [],
  status: 'idle',
  error: null,
  saving: false,
};

export const fetchBookings = createAsyncThunk<Booking[], void, { rejectValue: string }>(
  'bookings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const data = await graphql<{ bookings: Booking[] }>(BOOKINGS_QUERY);
      return data.bookings;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Could not load trips');
    }
  },
);

export const createBooking = createAsyncThunk<Booking, CreateBookingInput, { rejectValue: string }>(
  'bookings/create',
  async (input, { rejectWithValue }) => {
    try {
      const data = await graphql<{ createBooking: Booking }>(CREATE_BOOKING, { input });
      return data.createBooking;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Could not book this stay');
    }
  },
);

export const cancelBooking = createAsyncThunk<string, string, { rejectValue: string }>(
  'bookings/cancel',
  async (id, { rejectWithValue }) => {
    try {
      await graphql<{ cancelBooking: { id: string; status: string } }>(CANCEL_BOOKING, { id });
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Could not cancel');
    }
  },
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Could not load trips';
      })
      .addCase(createBooking.pending, (state) => {
        state.saving = true;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.saving = false;
        state.items = [action.payload, ...state.items.filter((item) => item.id !== action.payload.id)];
      })
      .addCase(createBooking.rejected, (state) => {
        state.saving = false;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const booking = state.items.find((item) => item.id === action.payload);
        if (booking) {
          booking.status = 'cancelled';
        }
      });
  },
});

export const bookingsReducer = bookingsSlice.reducer;
