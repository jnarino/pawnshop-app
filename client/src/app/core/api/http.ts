import { logout } from "../redux/authSlice";
import { store } from "../redux/store";
import { getAccessToken, refreshAccessToken } from '../auth/authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
        ...init,
    });
    if (res.status === 401) {
        store.dispatch(logout());
        throw new Error('Unauthorized');
    }
    if (!res.ok) {
        let msg = res.statusText;
        try { msg = (await res.json()).error || msg; } catch { }
        throw new Error(msg || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}

export async function http<T = any>(url: string, init: RequestInit = {}): Promise<T> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const finalUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    const headers = new Headers(init.headers || {});

    let token = getAccessToken();
    if (!token) {
        const refreshed = await refreshAccessToken();
        if (refreshed) token = getAccessToken();
    }

    if (token) headers.set('Authorization', `Bearer ${token}`);

    const resp = await fetch(finalUrl, { ...init, headers });
    if (!resp.ok) {
        let msg = resp.statusText;
        try { msg = (await resp.json()).error || msg; } catch { }
        throw new Error(msg || `HTTP ${resp.status}`);
    }
    return resp.json();
}
