import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Mail } from 'lucide-react';
import { useRecaptcha } from '@/hooks/use-recaptcha';
import { apiRequest } from '@/lib/queryClient';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const { isLoaded, isEnabled, renderRecaptcha, executeRecaptcha } = useRecaptcha();

  // Render reCAPTCHA when loaded
  useEffect(() => {
    if (isLoaded && isEnabled && recaptchaRef.current) {
      renderRecaptcha(recaptchaRef.current);
    }
  }, [isLoaded, isEnabled, renderRecaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRequiresVerification(false);
    setResendSuccess('');
    setLoading(true);

    try {
      // Get reCAPTCHA token if enabled
      let recaptchaToken = '';
      if (isEnabled) {
        try {
          recaptchaToken = await executeRecaptcha();
        } catch (err: any) {
          setError(err.message || 'Please complete the reCAPTCHA verification');
          setLoading(false);
          return;
        }
      }

      const user = await login(email, password, recaptchaToken);
      // Redirect based on role returned from login
      if (user.role === 'admin') {
        setLocation('/admin/dashboard');
      } else {
        setLocation('/user/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to log in';
      setError(errorMessage);
      
      // Check if backend response includes requiresVerification flag
      if (err.requiresVerification === true) {
        setRequiresVerification(true);
        // Store the email from backend response for resend functionality
        if (err.email) {
          setUnverifiedEmail(err.email);
        }
      }
      
      // Reset reCAPTCHA on error
      if (isEnabled && window.grecaptcha) {
        window.grecaptcha.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    // Use email from backend response if available, otherwise fall back to form input
    const emailToResend = unverifiedEmail || email;
    
    if (!emailToResend) {
      setError('Email address is required to resend verification');
      return;
    }
    
    setResendingEmail(true);
    setResendSuccess('');
    setError('');
    
    try {
      const result = await apiRequest('POST', '/api/auth/resend-verification', { email: emailToResend }) as unknown as { message: string };
      setResendSuccess(result.message);
      setRequiresVerification(false);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResendingEmail(false);
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
            
            {resendSuccess && (
              <Alert data-testid="alert-success">
                <Mail className="h-4 w-4" />
                <AlertDescription>{resendSuccess}</AlertDescription>
              </Alert>
            )}
            
            {requiresVerification && (
              <Alert data-testid="alert-verification-needed">
                <Mail className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>Your email address hasn't been verified yet.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                    className="w-full"
                    data-testid="button-resend-verification"
                  >
                    {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
                  </Button>
                </AlertDescription>
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

            {/* reCAPTCHA Widget */}
            {isEnabled && (
              <div className="flex justify-center">
                <div ref={recaptchaRef} className="g-recaptcha" data-testid="recaptcha-widget"></div>
              </div>
            )}

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
