import { useAuthStore } from '../store/useAuthStore';

const ACCESS_TOKEN_KEY = 'pawnshopApp.auth.accessToken';
const REFRESH_TOKEN_KEY = 'pawnshopApp.auth.refreshToken';
const ACCESS_EXPIRES_AT_KEY = 'pawnshopApp.auth.accessExpiresAt';

const REFRESH_ENDPOINT = '/api/auth/refresh';
const LOGIN_ENDPOINT = '/api/auth/login';
const LOGOUT_ENDPOINT = '/api/auth/logout';

const REFRESH_LEEWAY_MS = 60_000;

function setAccessExpiry(expiresInSeconds?: number): void {
  if (!expiresInSeconds) {
    localStorage.removeItem(ACCESS_EXPIRES_AT_KEY);
    return;
  }
  const expiresAt = Date.now() + expiresInSeconds * 1000 - REFRESH_LEEWAY_MS;
  localStorage.setItem(ACCESS_EXPIRES_AT_KEY, expiresAt.toString());
}

function storeTokens(response: { access_token: string; refresh_token?: string; expires_in?: number, user?: any }): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
  if (response.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
  }
  setAccessExpiry(response.expires_in);

  if (response.user) {
    useAuthStore.getState().setUser(response.user);
  }
}

function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_EXPIRES_AT_KEY);
  useAuthStore.getState().clearUser();
}

function notifyElectronAuthChange(isAuthenticated: boolean): void {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.electronAPI?.authChanged) {
      globalThis.electronAPI.authChanged(isAuthenticated);
    }
  } catch (error) {
    console.warn('[Auth] Failed to notify Electron about auth change:', error);
  }
}

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(LOGIN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const data = await response.json();
      storeTokens(data);
      notifyElectronAuthChange(true);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await fetch(LOGOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
    }
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    clearTokens();
    notifyElectronAuthChange(false);
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
  return raw ? Number.parseInt(raw, 10) : 0;
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
    notifyElectronAuthChange(true);

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
  if (access && !isAccessTokenExpired()) {
    return true;
  }
  return Boolean(getRefreshToken());
}

export function initializeAuth(): void {
  // Intentionally empty - localStorage is always available in browser environment
}

