// src/app/feature/auth/LoginPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '@/app/core/auth/authService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <div className="fixed inset-0 grid place-items-center z-[9999]">
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <Card className="relative z-[10000] w-[360px] max-w-[90vw] shadow-2xl">
        <form onSubmit={onSubmit}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">PawnExpress</CardTitle>
            <CardDescription>Sign in to continue</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    type="button"
                    className="underline text-xs ml-2"
                    onClick={clearError}
                    aria-label="Dismiss error message"
                  >
                    dismiss
                  </button>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                disabled={loading}
                required
                aria-describedby={error ? "error-message" : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                  className="pr-10"
                  aria-describedby={error ? "error-message" : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={togglePasswordVisibility}
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
            <p>Default: admin / admin</p>
            <p>© {new Date().getFullYear()} PawnExpress</p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}