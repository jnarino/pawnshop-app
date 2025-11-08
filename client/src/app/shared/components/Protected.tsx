import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { ensureFreshAccessToken, getRefreshToken, isAuthenticated } from '@/app/core/auth/authService';
=======
import { refreshAccessToken, getRefreshToken, isAuthenticated } from '@/app/core/auth/authService';
>>>>>>> feature/make_payment

export default function Protected({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'checking' | 'authed' | 'unauth'>('checking');

    useEffect(() => {
        let cancelled = false;
        const verify = async () => {
            const hasRefresh = !!getRefreshToken();
            if (!isAuthenticated() && !hasRefresh) {
                if (!cancelled) setStatus('unauth');
                return;
            }
<<<<<<< HEAD
            await ensureFreshAccessToken();
            if (cancelled) return;
            setStatus(isAuthenticated() ? 'authed' : (!!getRefreshToken() ? 'authed' : 'unauth'));
=======

            const refreshSuccessful = await refreshAccessToken();
            if (cancelled) return;

            setStatus(refreshSuccessful ? 'authed' : 'unauth');
>>>>>>> feature/make_payment
        };
        verify();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (status === 'unauth') {
            navigate('/login', { replace: true });
        }
    }, [status, navigate]);

    if (status !== 'authed') return null;
    return <>{children}</>;
}
