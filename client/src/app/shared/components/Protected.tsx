import { JSX, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../core/redux/store';
import { me } from '../../core/redux/authSlice';
import { Navigate } from 'react-router-dom';

export default function Protected({ children }: { children: JSX.Element }) {
    const dispatch = useDispatch<AppDispatch>();
    const user = useSelector((s: RootState) => s.auth.user);

    useEffect(() => { if (!user) dispatch(me()); }, [user, dispatch]);
    if (!user) return <Navigate to="/login" replace />;
    return children;
}
