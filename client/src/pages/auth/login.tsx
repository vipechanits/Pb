import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Redirect based on role returned from login
      if (user.role === 'admin') {
        setLocation('/admin/dashboard');
      } else {
        setLocation('/user/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center" data-testid="text-login-title">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center">
            Log in to your PAYBACK247 account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" data-testid="alert-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-center gap-2 text-sm text-muted-foreground">
            Don't have an account?
            <button
              className="p-0 h-auto text-primary hover:underline font-medium"
              onClick={() => setLocation('/auth/signup')}
              data-testid="link-signup"
            >
              Sign up
            </button>
          </div>
          <div className="text-center">
            <button
              className="p-0 h-auto text-sm text-muted-foreground hover:underline"
              onClick={() => setLocation('/auth/forgot-password')}
              data-testid="link-forgot-password"
            >
              Forgot password?
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
