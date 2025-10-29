import { logout } from "../redux/authSlice";
import { store } from "../redux/store";
import { getAccessToken, refreshAccessToken } from '../auth/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function http<T = any>(url: string, init: RequestInit = {}): Promise<T> {
    const finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const headers = new Headers(init.headers || {});

    // Get or refresh access token
    let token = getAccessToken();
    if (!token) {
        const refreshed = await refreshAccessToken();
        if (refreshed) token = getAccessToken();
    }

    // Attach JWT token
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Set default Content-Type if not provided
    if (!headers.has('Content-Type') && init.body) {
        headers.set('Content-Type', 'application/json');
    }

    const resp = await fetch(finalUrl, { ...init, headers });
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({
            error: resp.statusText,
            message: `HTTP ${resp.status}`
        }));
        throw new Error(error.message || error.error || 'Request failed');
    }
    return resp.json();
}

// Legacy alias for backward compatibility
export const api = http;
