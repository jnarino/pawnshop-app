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
    const resp = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!resp.ok) return false;

    const tokens: TokenResponse = await resp.json();
    accessToken = tokens.access_token;
    tokenExpiresAt = Date.now() + tokens.expires_in * 1000;
    
    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
    
    scheduleTokenRefresh();
    return true;
  } catch {
    return false;
  }
}

export function getAccessToken(): string | null {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }
  return null;
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const resp = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!resp.ok) {
      logout();
      return false;
    }

    const tokens: TokenResponse = await resp.json();
    accessToken = tokens.access_token;
    tokenExpiresAt = Date.now() + tokens.expires_in * 1000;
    
    scheduleTokenRefresh();
    return true;
  } catch {
    logout();
    return false;
  }
}

function scheduleTokenRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  
  // Refresh 1 minute before expiry (at 14 minutes for 15min tokens)
  const refreshIn = Math.max(0, tokenExpiresAt - Date.now() - 60000);
  refreshTimer = setTimeout(() => {
    refreshAccessToken();
  }, refreshIn);
}

export async function logout() {
  const refreshToken = localStorage.getItem('refresh_token');
  
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
  } catch {}
  
  window.location.href = '/login';
}

export function isAuthenticated(): boolean {
  return !!getAccessToken() || !!localStorage.getItem('refresh_token');
}

// Initialize: try to refresh on app load if we have a refresh token
export async function initializeAuth() {
  if (localStorage.getItem('refresh_token') && !accessToken) {
    await refreshAccessToken();
  }
}
