import { ensureFreshAccessToken, getAccessToken, refreshAccessToken, logout } from '@/app/core/auth/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function http<T = any>(url: string, init: RequestInit = {}, retry = true): Promise<T> {
    await ensureFreshAccessToken();

    const finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const headers = new Headers(init.headers || {});

    headers.set('Accept', 'application/json');

    const token = getAccessToken();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (init.body && !(init.body instanceof FormData)) {
        headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
    }

    console.log('[http] Making request to:', finalUrl);

    const resp = await fetch(finalUrl, { ...init, headers });

    if (resp.status === 401 && retry) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Retry request with new token
            return http<T>(finalUrl, { ...init, headers }, false);
        }
        await logout();
        throw new Error('Unauthorized');
    }

    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || resp.statusText);
    }

    if (resp.status === 204) {
        return undefined as T;
    }

    const data = await resp.json();
    return data as T;
}

// Legacy alias for backward compatibility
export const api = http;
