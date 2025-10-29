const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

let accessToken: string | null = null;
let tokenExpiresAt: number = 0;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export async function login(username: string, password: string): Promise<boolean> {
  try {
    console.log('[authService] Login attempt for:', username);
    const resp = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!resp.ok) {
      console.error('[authService] Login failed:', resp.status);
      return false;
    }

    const tokens: TokenResponse = await resp.json();
    accessToken = tokens.access_token;
    tokenExpiresAt = Date.now() + tokens.expires_in * 1000;

    console.log('[authService] ✅ Login successful');
    console.log('[authService] Access token:', accessToken?.substring(0, 20) + '...');
    console.log('[authService] Expires at:', new Date(tokenExpiresAt).toISOString());

    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token);
      console.log('[authService] Refresh token stored in localStorage');
    }

    scheduleTokenRefresh();
    return true;
  } catch (err) {
    console.error('[authService] Login error:', err);
    return false;
  }
}

export function getAccessToken(): string | null {
  const isValid = accessToken && Date.now() < tokenExpiresAt;
  console.log('[authService] getAccessToken called:', {
    hasToken: !!accessToken,
    isValid,
    expiresIn: tokenExpiresAt ? Math.floor((tokenExpiresAt - Date.now()) / 1000) + 's' : 'N/A'
  });

  if (isValid) {
    return accessToken;
  }

  console.warn('[authService] ⚠️ No valid access token available');
  return null;
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.warn('[authService] No refresh token available');
    return false;
  }

  try {
    console.log('[authService] Refreshing access token...');
    const resp = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!resp.ok) {
      console.error('[authService] Refresh failed:', resp.status);
      logout();
      return false;
    }

    const tokens: TokenResponse = await resp.json();
    accessToken = tokens.access_token;
    tokenExpiresAt = Date.now() + tokens.expires_in * 1000;

    console.log('[authService] ✅ Token refreshed successfully');
    scheduleTokenRefresh();
    return true;
  } catch (err) {
    console.error('[authService] Refresh error:', err);
    logout();
    return false;
  }
}

function scheduleTokenRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);

  const refreshIn = Math.max(0, tokenExpiresAt - Date.now() - 60000);
  console.log('[authService] Next refresh scheduled in:', Math.floor(refreshIn / 1000) + 's');

  refreshTimer = setTimeout(() => {
    console.log('[authService] Auto-refresh triggered');
    refreshAccessToken();
  }, refreshIn);
}

export async function logout() {
  const refreshToken = localStorage.getItem('refresh_token');

  console.log('[authService] Logging out...');
  if (refreshTimer) clearTimeout(refreshTimer);
  accessToken = null;
  tokenExpiresAt = 0;
  localStorage.removeItem('refresh_token');

  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch { }

  window.location.href = '/login';
}

export function isAuthenticated(): boolean {
  const result = !!getAccessToken() || !!localStorage.getItem('refresh_token');
  console.log('[authService] isAuthenticated:', result);
  return result;
}

export async function initializeAuth() {
  console.log('[authService] Initializing auth...');
  if (localStorage.getItem('refresh_token') && !accessToken) {
    await refreshAccessToken();
  }
}
