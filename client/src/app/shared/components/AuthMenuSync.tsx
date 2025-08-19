import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/core/redux/store';

/**
 * Synchronizes auth state to Electron main process so menu can update (login/logout + disabled items).
 */
declare global {
  interface Window { electronAPI?: { onNavigate?: (cb: any)=>void; authChanged?: (authed: boolean)=>void } }
}

export default function AuthMenuSync() {
  const user = useSelector((s: RootState) => s.auth.user);
  useEffect(() => {
    // @ts-ignore - electronAPI injected by preload when running in Electron
    if (window.electronAPI?.authChanged) {
      // send boolean
      window.electronAPI.authChanged(!!user);
    }
  }, [user]);
  return null;
}
