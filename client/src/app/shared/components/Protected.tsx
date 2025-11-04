import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ensureFreshAccessToken, getRefreshToken, isAuthenticated } from '@/app/core/auth/authService';

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
            await ensureFreshAccessToken();
            if (cancelled) return;
            setStatus(isAuthenticated() ? 'authed' : (!!getRefreshToken() ? 'authed' : 'unauth'));
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
