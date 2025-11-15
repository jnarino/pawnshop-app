// src/app/feature/auth/LoginPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '@/app/core/auth/authService';
import './LoginPage.css';

// ✅ Single Responsibility: Handle Electron notifications safely
const notifyElectronAuth = (authenticated: boolean): void => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.electronAPI?.authChanged) {
      globalThis.electronAPI.authChanged(authenticated);
    }
  } catch (electronError) {
    console.warn('[LoginPage] Failed to notify Electron:', electronError);
    // Continue - this is not critical for web version
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Single Responsibility: Reset form state
  const resetForm = useCallback(() => {
    setUsername('');
    setPassword('');
    setShowPw(false);
    setLoading(false);
    setError('');
  }, []);

  // Reset form when component mounts
  useEffect(() => {
    resetForm();
  }, [resetForm]);

  // ✅ Single Responsibility: Handle form submission
  const onSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        notifyElectronAuth(true);
        
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
  }, [username, password, loading, location.state, navigate]);

  // ✅ Single Responsibility: Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPw(prev => !prev);
  }, []);

  // ✅ Single Responsibility: Clear error message
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // ✅ Derived state: Check if form is valid
  const isFormValid = username.trim() && password.trim() && !loading;

  return (
    <div className="login-overlay">
      <div className="login-backdrop" aria-hidden="true" />
      <dialog open className="login-dialog">
        <form onSubmit={onSubmit}>
          <h1 className="login-title">PawnExpress</h1>
          <p className="login-subtitle">Sign in to continue</p>

          {error && (
            <div className="login-error" role="alert">
              {error}{' '}
              <button
                type="button"
                className="underline"
                onClick={clearError}
                aria-label="Dismiss error message"
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
              disabled={loading}
              required
              aria-describedby={error ? "error-message" : undefined}
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
                disabled={loading}
                required
                aria-describedby={error ? "error-message" : undefined}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="login-pw-toggle"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="login-button"
            disabled={!isFormValid}
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
