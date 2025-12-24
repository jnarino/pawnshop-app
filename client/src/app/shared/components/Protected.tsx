import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { refreshAccessToken, getRefreshToken, isAuthenticated } from '@/app/core/auth/authService';
import { Header } from '@/components/ui/Header';

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

            const refreshSuccessful = await refreshAccessToken();
            if (cancelled) return;

            setStatus(refreshSuccessful ? 'authed' : 'unauth');
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
    return <>
        <Header />
        <div className="min-h-screen flex flex-col">
            <main className="py-7 px-7 max-w-[1100px] w-full mx-auto">
                {children}
            </main>
        </div>
    </>;
}
