import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '@/app/core/auth/authService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VisibilityIcon from '@/assets/icons/visibility.svg?react';
import VisibilityOffIcon from '@/assets/icons/visibility_off.svg?react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUsername('');
    setPassword('');
    setShowPw(false);
    setLoading(false);
    setError('');
  }, []);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
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
    <div className="fixed inset-0 grid place-items-center z-[9999]">
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <Card className="relative z-[10000] w-[360px] max-w-[90vw] shadow-2xl">
        <form onSubmit={onSubmit}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">PawnExpress</CardTitle>
            <CardDescription>Sign in to continue</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    type="button"
                    className="underline text-sm"
                    onClick={() => setError('')}
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
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPw ? (
                    <VisibilityOffIcon className="w-5 h-5 fill-current" />
                  ) : (
                    <VisibilityIcon className="w-5 h-5 fill-current" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !username || !password}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col text-center text-xs text-gray-500 space-y-1">
            <p className="text-sm text-gray-600">Default: admin / admin</p>
            <p>© {new Date().getFullYear()} PawnExpress</p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
