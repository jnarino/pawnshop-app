import { JSX, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/core/redux/store';
import { me } from '@/app/core/redux/authSlice';
import { Navigate } from 'react-router-dom';

export default function Protected({ children }: { children: JSX.Element }) {
    const dispatch = useDispatch<AppDispatch>();
    const user = useSelector((s: RootState) => s.auth.user);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!user) {
                try { await dispatch(me()).unwrap(); } catch { }
            }
            if (mounted) setChecked(true);
        })();
        return () => { mounted = false; };
    }, [user, dispatch]);

    if (!checked) return null;       // could render a spinner
    return user ? children : <Navigate to="/login" replace />;
}
