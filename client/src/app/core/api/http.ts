import { logout } from "../redux/authSlice";
import { store } from "../redux/store";


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
    if (!res.ok) throw new Error((await res.text().catch(() => '')) || res.statusText);
    return res.json() as Promise<T>;
}
