const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function api<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        credentials: 'include',           // <-- send/receive cookie
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(msg || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}
