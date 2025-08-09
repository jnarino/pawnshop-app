import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../core/redux/store';
import { login, me, resetError } from '../../core/redux/authSlice';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const dispatch = useDispatch<AppDispatch>();
    const nav = useNavigate();
    const { user, status, error } = useSelector((s: RootState) => s.auth);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => { dispatch(me()); }, [dispatch]);
    useEffect(() => { if (user) nav('/'); }, [user, nav]);

    return (
        <div className="min-h-screen grid place-items-center p-6">
            <div className="w-full max-w-sm rounded-2xl shadow p-6 space-y-4">
                <h1 className="text-2xl font-semibold">Sign in</h1>
                {error && (
                    <div className="text-red-600 text-sm">
                        {error} <button className="underline" onClick={() => dispatch(resetError())}>dismiss</button>
                    </div>
                )}
                <label className="block">
                    <span className="text-sm">Username</span>
                    <input className="mt-1 w-full border rounded p-2"
                        value={username} onChange={e => setUsername(e.target.value)} />
                </label>
                <label className="block">
                    <span className="text-sm">Password</span>
                    <input type="password" className="mt-1 w-full border rounded p-2"
                        value={password} onChange={e => setPassword(e.target.value)} />
                </label>

                <button
                    className="w-full rounded-xl p-2 border font-medium disabled:opacity-60"
                    disabled={status === 'loading'}
                    onClick={() => dispatch(login({ username, password }))}>
                    {status === 'loading' ? 'Signing in…' : 'Sign in'}
                </button>
            </div>
        </div>
    );
}
