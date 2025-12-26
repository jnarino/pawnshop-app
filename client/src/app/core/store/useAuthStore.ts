import { create } from 'zustand';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthUser {
    id: string | number;
    username: string;
    role?: string;
    roles: string[];
}

interface AuthState {
    user: AuthUser | null;
    status: AuthStatus;
    error: string | null;

    setUser: (user: AuthUser | null) => void;
    setStatus: (status: AuthStatus) => void;
    setError: (error: string | null) => void;
    clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    status: 'idle',
    error: null,

    setUser: (user) => set({ user, status: user ? 'authenticated' : 'idle', error: null }),
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error, status: 'error' }),
    clearUser: () => set({ user: null, status: 'idle', error: null }),
}));
