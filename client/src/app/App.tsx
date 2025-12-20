import AppRouter from './AppRouter';
import AuthMenuSync from './shared/components/AuthMenuSync';
import ElectronMenuBridge from './shared/components/ElectronMenuBridge';
import { LookupInitializer } from './shared/components/LookupInitializer';
import { Toaster } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getAccessToken } from './core/auth/authService';

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

export default function App() {
  return (
    <>
      <AuthMenuSync />
      <ElectronMenuBridge />
      <ElectronNavHandler />
      <LookupInitializer>
        <AppRouter />
      </LookupInitializer>
      <Toaster position="top-right" />
    </>
  );
}
