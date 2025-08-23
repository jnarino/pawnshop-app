// src/app/feature/auth/LoginPage.tsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../core/redux/store';
import { login, me, resetError } from '../../core/redux/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const nav = useNavigate();
  const location = useLocation();

  const { status, error } = useSelector((s: RootState) => s.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Try to restore session (cookie-based)
  useEffect(() => {
    dispatch(me());
  }, [dispatch]);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (status === 'loading') return;
    try {
  await dispatch(login({ username, password })).unwrap(); // waits for 200 + JSON
  // Explicitly notify Electron main (in addition to AuthMenuSync fallback)
  // @ts-ignore
  if (window.electronAPI?.authChanged) window.electronAPI.authChanged(true);
      const from = (location.state as any)?.from?.pathname ?? '/';
      nav(from, { replace: true }); // <-- immediate redirect on success
    } catch {
      // error already in Redux; UI shows it
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-backdrop" aria-hidden="true" />
      <dialog open className="login-dialog">
        <form onSubmit={onSubmit}>
          <h1 className="login-title">PawnExpress</h1>
          <p className="login-subtitle">Sign in to continue</p>

          {error && (
            <div className="login-error">
              {error}{' '}
              <button
                type="button"
                className="underline"
                onClick={() => dispatch(resetError())}
              >
                dismiss
              </button>
            </div>
          )}

          <label className="login-label">
            <span>Username</span>
            <input
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </label>

          <label className="login-label">
            <span>Password</span>
            <div className="login-pw-wrap">
              <input
                className="login-input pw"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="login-pw-toggle"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="login-button"
            disabled={status === 'loading' || !username || !password}
          >
            {status === 'loading' ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="login-foot">© {new Date().getFullYear()} PawnExpress</div>
        </form>
      </dialog>
    </div>
  );
}
