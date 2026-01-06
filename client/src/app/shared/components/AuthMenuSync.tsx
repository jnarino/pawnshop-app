import { useEffect } from 'react';
import { useAuthStore } from '@/app/core/store/useAuthStore';

/**
 * Synchronizes auth state to Electron main process so menu can update (login/logout + disabled items).
 */
// global declaration moved to electron/preload.ts

export default function AuthMenuSync() {
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    const api = window.electronAPI;
    if (api?.authChanged) {
      const authed = !!user; // only trust Store user state to drive menu visibility
      api.authChanged(authed);
      api.refreshMenu?.();
    }
  }, [user]);
  return null;
}
