const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });

    if (!response.ok) return false;

    const data = await response.json();
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    console.log('[Auth] ✅ Login successful');
    
    return true;
  } catch (error) {
    console.error('[Auth] ❌ Login failed:', error);
    return false;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');
  
  try {
    // ✅ Call server logout endpoint
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } catch (error) {
    console.error('[Auth] Logout API error (continuing anyway):', error);
  } finally {
    // ✅ ALWAYS clear local storage (even if API fails)
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // ✅ Notify Electron
    if (window.electronAPI?.authChanged) {
      window.electronAPI.authChanged(false);
    }
    
    console.log('[Auth] ✅ Logged out - all tokens cleared');
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'include'
    });

    if (!response.ok) {
      logout();
      return false;
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    
    return true;
  } catch (error) {
    logout();
    return false;
  }
}

// No-op for backward compatibility
export function initializeAuth(): void {
  // Do nothing - localStorage is always available
}
