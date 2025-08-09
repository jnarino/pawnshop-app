import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Me } from '../../core/api/auth';
import { login as loginApi, fetchMe, logout as logoutApi } from '../../core/api/auth';

type AuthState = {
    user: Me | null;
    status: 'idle' | 'loading' | 'error';
    error?: string;
};

const initialState: AuthState = { user: null, status: 'idle' };

export const login = createAsyncThunk('auth/login',
    async (payload: { username: string; password: string }, { rejectWithValue }) => {
        try { return await loginApi(payload.username, payload.password); }
        catch (e: any) { return rejectWithValue(e.message || 'Login failed'); }
    }
);

export const me = createAsyncThunk('auth/me',
    async (_, { rejectWithValue }) => {
        try { return await fetchMe(); }
        catch (e: any) { return rejectWithValue(e.message || 'Not authenticated'); }
    }
);

export const logout = createAsyncThunk('auth/logout',
    async () => { await logoutApi(); return true; }
);

const slice = createSlice({
    name: 'auth',
    initialState,
    reducers: { resetError(s) { s.error = undefined; } },
    extraReducers: b => {
        b.addCase(login.pending, s => { s.status = 'loading'; s.error = undefined; });
        b.addCase(login.fulfilled, (s, a) => { s.status = 'idle'; s.user = a.payload; });
        b.addCase(login.rejected, (s, a) => { s.status = 'error'; s.error = String(a.payload); });

        b.addCase(me.fulfilled, (s, a) => { s.user = a.payload; s.status = 'idle'; });
        b.addCase(me.rejected, (s) => { s.user = null; s.status = 'idle'; });

        b.addCase(logout.fulfilled, (s) => { s.user = null; });
    }
});

export const { resetError } = slice.actions;
export default slice.reducer;
