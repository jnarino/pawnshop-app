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
            } finally {
                navigate('/login', { replace: true });
            }
        })();
    }, [navigate, dispatch]);

    return null;
}
