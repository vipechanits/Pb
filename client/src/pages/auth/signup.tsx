import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Mail } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [binaryLeg, setBinaryLeg] = useState<'left' | 'right' | undefined>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Read URL parameters for referral
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    const legParam = params.get('leg');
    
    if (refParam) {
      setSponsorId(refParam);
    }
    if (legParam === 'left' || legParam === 'right') {
      setBinaryLeg(legParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest('POST', '/api/auth/signup', {
        email,
        password,
        sponsorId: sponsorId || undefined,
        binaryLeg: binaryLeg || undefined
      });
      
      // Show success message
      setSignupSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Show success message after signup
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Mail className="h-16 w-16 text-primary" data-testid="icon-email" />
            </div>
            <CardTitle className="text-2xl font-bold" data-testid="text-success-title">
              Check Your Email
            </CardTitle>
            <CardDescription data-testid="text-success-description">
              We've sent a verification link to <strong className="text-foreground">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert data-testid="alert-info">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Please check your email and click the verification link to activate your account. The link will expire in 24 hours.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => setLocation('/auth/login')}
              variant="outline"
              className="w-full"
              data-testid="button-goto-login"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center" data-testid="text-signup-title">
            Create an account
          </CardTitle>
          <CardDescription className="text-center">
            Join PAYBACK247 and start earning today
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
                placeholder="Enter password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                data-testid="input-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirm-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sponsorId">Sponsor ID {binaryLeg ? '(From Referral Link)' : '(Optional)'}</Label>
              <Input
                id="sponsorId"
                type="text"
                placeholder="PB10000 (if you have a referral)"
                value={sponsorId}
                onChange={(e) => setSponsorId(e.target.value)}
                data-testid="input-sponsor-id"
                readOnly={!!binaryLeg}
                className={binaryLeg ? 'bg-secondary/50 cursor-not-allowed' : ''}
              />
              {binaryLeg && (
                <p className="text-xs text-muted-foreground">
                  You'll be placed on the <strong className="text-foreground">{binaryLeg.toUpperCase()}</strong> leg of {sponsorId}'s binary tree
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading} data-testid="button-signup">
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center gap-2 text-sm text-muted-foreground">
          Already have an account?
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => setLocation('/auth/login')}
            data-testid="link-login"
          >
            Log in
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
