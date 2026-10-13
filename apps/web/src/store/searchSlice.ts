import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { graphql } from '../api/client';
import { HOTELS_QUERY } from '../api/queries';
import type { HotelSearchResult, SearchCriteria } from '../api/types';
import { defaultStay } from '../lib/dates';

const stay = defaultStay();

type SearchState = SearchCriteria & {
  hotels: HotelSearchResult['hotels'];
  total: number;
  cached: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: SearchState = {
  query: '',
  checkIn: stay.checkIn,
  checkOut: stay.checkOut,
  guests: 2,
  maxPrice: null,
  hotels: [],
  total: 0,
  cached: false,
  status: 'idle',
  error: null,
};

export const fetchHotels = createAsyncThunk<HotelSearchResult, SearchCriteria, { rejectValue: string }>(
  'search/fetchHotels',
  async (criteria, { rejectWithValue }) => {
    try {
      const data = await graphql<{ hotels: HotelSearchResult }>(HOTELS_QUERY, {
        query: criteria.query,
        checkIn: criteria.checkIn,
        checkOut: criteria.checkOut,
        guests: criteria.guests,
        maxPrice: criteria.maxPrice,
      });
      return data.hotels;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Search failed');
    }
  },
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setCriteria(state, action: PayloadAction<Partial<SearchCriteria>>) {
      Object.assign(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.hotels = action.payload.hotels;
        state.total = action.payload.total;
        state.cached = action.payload.cached;
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Search failed';
      });
  },
});

export const { setCriteria } = searchSlice.actions;
export const searchReducer = searchSlice.reducer;

export function criteriaOf(state: SearchState): SearchCriteria {
  return {
    query: state.query,
    checkIn: state.checkIn,
    checkOut: state.checkOut,
    guests: state.guests,
    maxPrice: state.maxPrice,
  };
}
