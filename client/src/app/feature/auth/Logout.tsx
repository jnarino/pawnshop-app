// src/app/feature/auth/Logout.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
// import { authActions } from '@/app/core/redux/authSlice'; // if you have one

export default function Logout() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        try {
            localStorage.removeItem('authToken');
            // dispatch(authActions.signedOut()); // optional if you keep auth in redux
        } finally {
            navigate('/login', { replace: true });
        }
    }, [navigate, dispatch]);

    return null;
}
