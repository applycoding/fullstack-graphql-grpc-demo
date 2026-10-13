import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { graphql } from '../api/client';
import { ME_QUERY } from '../api/queries';
import type { AuthConfig, User } from '../api/types';

type AuthState = {
  config: AuthConfig;
  user: User | null;
  status: 'loading' | 'ready' | 'error';
};

const initialState: AuthState = {
  config: { mock: false, github: false },
  user: null,
  status: 'loading',
};

export const fetchSession = createAsyncThunk('auth/session', async (_, { rejectWithValue }) => {
  try {
    const configResponse = await fetch('/auth/config', { credentials: 'include' });
    if (!configResponse.ok) {
      return rejectWithValue('Sign-in is unavailable');
    }
    const config = (await configResponse.json()) as AuthConfig;
    const data = await graphql<{ me: User | null }>(ME_QUERY);
    return { config, user: data.me };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Sign-in is unavailable');
  }
});

export const signInMock = createAsyncThunk('auth/mock', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch('/auth/mock', { method: 'POST', credentials: 'include' });
    if (!response.ok) {
      return rejectWithValue('Demo sign-in is unavailable');
    }
    const data = await graphql<{ me: User | null }>(ME_QUERY);
    if (!data.me) {
      return rejectWithValue('Sign-in did not stick');
    }
    return data.me;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Demo sign-in failed');
  }
});

export const signOut = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    if (!response.ok) {
      return rejectWithValue('Sign-out failed');
    }
    return null;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Sign-out failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.config = action.payload.config;
        state.user = action.payload.user;
        state.status = 'ready';
      })
      .addCase(fetchSession.rejected, (state) => {
        state.status = 'error';
      })
      .addCase(signInMock.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'ready';
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const authReducer = authSlice.reducer;
