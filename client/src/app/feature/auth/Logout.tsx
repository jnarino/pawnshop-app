// src/app/feature/auth/Logout.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../core/redux/authSlice';

// ✅ Single Responsibility: Handle Electron notifications safely
const notifyElectronAuth = (authenticated: boolean): void => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.electronAPI?.authChanged) {
      globalThis.electronAPI.authChanged(authenticated);
    }
  } catch (electronError) {
    console.warn('[Logout] Failed to notify Electron:', electronError);
    // Continue - this is not critical for web version
  }
};

export default function Logout() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            try {
                await dispatch<any>(logout());
                notifyElectronAuth(false);
            } finally {
                // Navigate then hard refresh to clear any lingering component state
                navigate('/test', { replace: true });
                setTimeout(() => {
                    if (window.location.hash !== '#/test') window.location.hash = '#/test';
                    window.location.reload();
                }, 50);
            }
        })();
    }, [navigate, dispatch]);

    return null;
}
