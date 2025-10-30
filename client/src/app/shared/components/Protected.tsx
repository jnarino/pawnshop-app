import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/app/core/auth/authService';

export default function Protected({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    if (!isAuthenticated()) return null;
    return <>{children}</>;
}
