// src/app/feature/auth/LoginPage.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '@/app/core/auth/authService';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        // Notify Electron
        if (window.electronAPI?.authChanged) {
          window.electronAPI.authChanged(true);
        }
        const from = (location.state as any)?.from?.pathname ?? '/';
        navigate(from, { replace: true });
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
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
                onClick={() => setError('')}
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
            disabled={loading || !username || !password}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="login-foot">
            <p className="text-sm text-gray-600">Default: admin / admin</p>
            <p>© {new Date().getFullYear()} PawnExpress</p>
          </div>
        </form>
      </dialog>
    </div>
  );
}
