import { api } from './http';

export type Me = { id: string; username: string; roles: string[] };

export function login(username: string, password: string) {
    return api<Me>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
}
export function fetchMe() {
    return api<Me>('/api/auth/me');
}
export function logout() {
    return api<{ ok: true }>('/api/auth/logout', { method: 'POST' });
}
