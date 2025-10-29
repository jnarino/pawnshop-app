import { getAccessToken, refreshAccessToken, logout } from '../auth/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function http<T = any>(url: string, init: RequestInit = {}): Promise<T> {
    const finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const headers = new Headers(init.headers || {});

    console.log('[http] Making request to:', finalUrl);

    // Get or refresh access token
    let token = getAccessToken();
    if (!token) {
        console.warn('[http] No token found, attempting refresh...');
        const refreshed = await refreshAccessToken();
        if (refreshed) token = getAccessToken();
    }

    // If still no token after refresh attempt, redirect to login
    if (!token) {
        console.error('[http] ❌ No token available after refresh');
        logout();
        throw new Error('Authentication required');
    }

    // Attach JWT token
    console.log('[http] ✅ Attaching token:', token.substring(0, 20) + '...');
    headers.set('Authorization', `Bearer ${token}`);

    // Set default Content-Type if not provided and there's a body
    if (!headers.has('Content-Type') && init.body) {
        headers.set('Content-Type', 'application/json');
    }

    const resp = await fetch(finalUrl, { ...init, headers });
    console.log('[http] Response status:', resp.status);

    if (resp.status === 401) {
        console.warn('[http] Got 401, attempting token refresh...');
        // Token expired or invalid, try to refresh
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Retry request with new token
            const newToken = getAccessToken();
            if (newToken) {
                headers.set('Authorization', `Bearer ${newToken}`);
                console.log('[http] Retrying with new token');
                const retryResp = await fetch(finalUrl, { ...init, headers });
                if (!retryResp.ok) {
                    throw new Error(`HTTP ${retryResp.status}: ${retryResp.statusText}`);
                }
                return retryResp.json();
            }
        }
        // Refresh failed, logout
        logout();
        throw new Error('Session expired');
    }

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
