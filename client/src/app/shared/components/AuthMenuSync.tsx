import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/core/redux/store';

/**
 * Synchronizes auth state to Electron main process so menu can update (login/logout + disabled items).
 */
// global declaration moved to electron/preload.ts

export default function AuthMenuSync() {
  const user = useSelector((s: RootState) => s.auth.user);
  useEffect(() => {
    const api = window.electronAPI;
    if (api?.authChanged) {
      const authed = !!user; // only trust Redux user state to drive menu visibility
      api.authChanged(authed);
      api.refreshMenu?.();
    }
  }, [user]);
  return null;
}
