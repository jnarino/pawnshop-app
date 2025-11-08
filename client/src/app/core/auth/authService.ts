const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const ACCESS_TOKEN_KEY = 'pawnshopApp.auth.accessToken';
const REFRESH_TOKEN_KEY = 'pawnshopApp.auth.refreshToken';
const ACCESS_EXPIRES_AT_KEY = 'pawnshopApp.auth.accessExpiresAt';

const REFRESH_ENDPOINT = '/api/auth/refresh';
const LOGIN_ENDPOINT = '/api/auth/login';
const LOGOUT_ENDPOINT = '/api/auth/logout';

const REFRESH_LEEWAY_MS = 60_000;

function setAccessExpiry(expiresInSeconds?: number) {
  if (!expiresInSeconds) {
    localStorage.removeItem(ACCESS_EXPIRES_AT_KEY);
    return;
  }
  const expiresAt = Date.now() + expiresInSeconds * 1000 - REFRESH_LEEWAY_MS;
  localStorage.setItem(ACCESS_EXPIRES_AT_KEY, String(expiresAt));
}

function storeTokens(response: { access_token: string; refresh_token?: string; expires_in?: number }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
  if (response.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
  }
  setAccessExpiry(response.expires_in);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_EXPIRES_AT_KEY);
}

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });

    if (!response.ok) return false;

    const result = await response.json();

    storeTokens(result);

    console.log('[Auth] ✅ Login successful');

    return true;
  } catch (error) {
    console.error('[Auth] ❌ Login failed:', error);
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      await fetch(LOGOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
    }
  } catch (error) {
    console.warn('[Auth] logout failed', error);
  } finally {
    clearTokens();
    window.electronAPI?.authChanged?.(false);
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function getAccessExpiresAt(): number {
  const raw = localStorage.getItem(ACCESS_EXPIRES_AT_KEY);
  return raw ? Number(raw) : 0;
}

export function isAccessTokenExpired(): boolean {
  const expiresAt = getAccessExpiresAt();
  return !expiresAt || Date.now() >= expiresAt;
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(REFRESH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const result = await response.json();
    storeTokens(result);
    window.electronAPI?.authChanged?.(true);
    return true;
  } catch (error) {
    console.error('[Auth] refresh failed', error);
    clearTokens();
    return false;
  }
}

export async function ensureFreshAccessToken(): Promise<boolean> {
  const access = getAccessToken();
  if (!access) {
    return getRefreshToken() ? refreshAccessToken() : false;
  }
  if (isAccessTokenExpired()) {
    return refreshAccessToken();
  }
  return true;
}

export function isAuthenticated(): boolean {
  const access = getAccessToken();
  if (access && !isAccessTokenExpired()) return true;
  return !!getRefreshToken();
}

// No-op for backward compatibility
export function initializeAuth(): void {
  // Do nothing - localStorage is always available
}
