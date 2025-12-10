// src/app/core/redux/authSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthUser {
  id: string | number;
  username: string;
  // add any fields you return from the server
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

// Use explicit API base in dev unless you have a Vite proxy set up.
const API_BASE: string =
  (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:3001';

/**
 * LOGIN
 * Server returns the plain user object (not { user }).
 * We wrap it into { user } to match our reducers.
 */
export const login = createAsyncThunk<
  { user: AuthUser },                                // return type
  { username: string; password: string },            // arg type
  { rejectValue: string }                            // reject type
>('auth/login', async (body, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // cookie session
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return rejectWithValue(text || 'Invalid username or password');
    }
    const user = (await res.json()) as AuthUser;     // plain user
    return { user };                                 // wrap it
  } catch (e: any) {
    return rejectWithValue(e?.message || 'Network error');
  }
});

/**
 * ME (session restore)
 * If unauthenticated, return { user: null }.
 */
export const me = createAsyncThunk<
  { user: AuthUser | null },
  void,
  { rejectValue: string }
>('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
    });
    if (!res.ok) {
      // Not signed in
      return { user: null };
    }
    const user = (await res.json()) as AuthUser;     // plain user
    return { user: user ?? null };
  } catch (e: any) {
    return rejectWithValue(e?.message || 'Network error');
  }
});

/**
 * LOGOUT (optional but handy)
 */
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
  } catch (e: any) {
    return rejectWithValue(e?.message || 'Network error');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetError(state) {
      state.error = null;
      if (state.status === 'error') {
        state.status = state.user ? 'authenticated' : 'idle';
      }
    },
    signedOut(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
    // Optional: set user directly if needed
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) || 'Login failed';
      })

      // me
      .addCase(me.fulfilled, (state, action) => {
        const u = action.payload.user;
        state.user = u;
        state.status = u ? 'authenticated' : 'idle';
        if (!u) state.error = null;
      })
      .addCase(me.rejected, (state) => {
        state.user = null;
        state.status = 'idle';
      })

      // logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Logout failed';
      });
  },
});

export const { resetError, signedOut, setUser } = authSlice.actions;
export default authSlice.reducer;
