import AppRouter from './AppRouter';
import AuthMenuSync from './shared/components/AuthMenuSync';
import { Toaster } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { isAuthenticated, initializeAuth, getAccessToken } from './core/auth/authService';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeAuth();
    setInitialized(true);
    if (!isAuthenticated()) navigate('/login');
  }, [navigate]);

  if (!initialized) return null;
  if (!isAuthenticated()) return null;
  return <>{children}</>;
}

function ElectronNavHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    // @ts-ignore preload injection
    if (window.electronAPI?.onNavigate) {
      // Avoid duplicate handlers: remove previous then add
      const handler = (route: string) => {
        if (route && typeof route === 'string') navigate(route);
      };
      window.electronAPI.onNavigate(handler);
    }
  }, [navigate]);
  return null;
}

// Add this temporarily for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = () => {
    console.log('[DEBUG] Access token:', getAccessToken());
    console.log('[DEBUG] Refresh token:', localStorage.getItem('refresh_token'));
  };
}

export default function App() { return <><AuthMenuSync /><ElectronNavHandler /><AppRouter /><Toaster position="top-right" /></>; }
