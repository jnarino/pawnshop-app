import { useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import * as authService from '../auth/authService';

export function useAuth() {
    const { user, status, error, setUser, setStatus, setError, clearUser } = useAuthStore();

    const login = useCallback(async (username: string, password: string) => {
        setStatus('loading');
        try {
            const success = await authService.login(username, password);
            if (!success) {
                setError('Invalid credentials');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        }
    }, [setStatus, setError]);

    const logout = useCallback(async () => {
        setStatus('loading');
        await authService.logout();
    }, [setStatus]);

    const restoreSession = useCallback(async () => {
        if (authService.isAuthenticated()) {
            if (!user) {
                const success = await authService.ensureFreshAccessToken();
                if (!success) clearUser();
            }
        } else {
            const success = await authService.refreshAccessToken();
            if (!success) clearUser();
        }
    }, [user, clearUser]);

    return {
        user,
        status,
        error,
        login,
        logout,
        restoreSession,
        isAuthenticated: !!user
    };
}
