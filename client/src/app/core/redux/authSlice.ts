import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthUser {
  id: string | number;
  username: string;
  role?: string;
}

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

const API_BASE: string =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } })?.env?.VITE_API_URL || 'http://localhost:3001';

export const logout = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return rejectWithValue(text || 'Logout failed');
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Network error';
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'idle';
    },
    clearUser(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.user = null;
        state.status = 'idle';
        state.error = (action.payload as string) || 'Logout failed';
      });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
