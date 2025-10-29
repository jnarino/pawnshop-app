import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, initializeAuth } from '@/app/core/auth/authService';

export default function Protected({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    useEffect(() => {
        initializeAuth().then(() => {
            if (!isAuthenticated()) {
                navigate('/login');
            }
        });
    }, [navigate]);

    if (typeof window !== 'undefined' && window.electronAPI?.authChanged) {
        window.electronAPI.authChanged(isAuthenticated());
    }

    if (!isAuthenticated()) return null;
    return <>{children}</>;
}
