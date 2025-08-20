// src/app/feature/auth/Logout.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../core/redux/authSlice';

export default function Logout() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            try {
                await dispatch<any>(logout());
                // @ts-ignore
                if (window.electronAPI?.authChanged) window.electronAPI.authChanged(false);
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
