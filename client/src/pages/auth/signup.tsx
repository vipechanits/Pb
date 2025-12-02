import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Mail, Check, ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useRecaptcha } from '@/hooks/use-recaptcha';
import { CustomCaptcha } from '@/components/custom-captcha';

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const { isLoaded, isEnabled, renderRecaptcha, executeRecaptcha } = useRecaptcha();
  const { data: systemConfig } = useQuery({
    queryKey: ['/api/system-config'],
  }) as any;

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // UI state
  const [stage, setStage] = useState<'form' | 'success'>('form');
  const [successEmail, setSuccessEmail] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [customCaptchaValid, setCustomCaptchaValid] = useState(false);

  // URL parameters for referral
  const [referralData] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      sponsorId: params.get('ref') || undefined,
      binaryLeg: (params.get('leg') as 'left' | 'right') || undefined,
    };
  });

  // Render reCAPTCHA when loaded
  useEffect(() => {
    if (isLoaded && isEnabled && recaptchaRef.current) {
      renderRecaptcha(recaptchaRef.current);
    }
  }, [isLoaded, isEnabled, renderRecaptcha]);

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email address';
    }

    if (!mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(mobile)) {
      errors.mobile = 'Mobile number must be exactly 10 digits';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      errors.terms = 'You must accept the terms & conditions';
    }

    if (systemConfig?.customCaptchaEnabled && !customCaptchaValid) {
      errors.captcha = 'Please complete the security verification';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Get reCAPTCHA token if enabled
      let recaptchaToken = '';
      if (isEnabled) {
        try {
          recaptchaToken = await executeRecaptcha();
        } catch (err: any) {
          setError(err.message || 'Please complete the reCAPTCHA verification');
          setIsLoading(false);
          return;
        }
      }

      // Submit signup request
      await apiRequest('POST', '/api/auth/signup', {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        sponsorId: referralData.sponsorId,
        binaryLeg: referralData.binaryLeg,
        recaptchaToken: recaptchaToken || undefined,
      });

      // Success - show verification email screen
      setSuccessEmail(email);
      setStage('success');

      // Reset reCAPTCHA on success
      if (isEnabled && window.grecaptcha) {
        window.grecaptcha.reset();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create account. Please try again.';
      setError(errorMessage);

      // Reset reCAPTCHA on error
      if (isEnabled && window.grecaptcha) {
        window.grecaptcha.reset();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (stage === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" data-testid="icon-success" />
            </div>
            <CardTitle className="text-2xl font-bold" data-testid="text-success-title">
              Verify Your Email
            </CardTitle>
            <CardDescription data-testid="text-success-description">
              We've sent a verification link to <strong className="text-foreground">{successEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert data-testid="alert-info">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Check your inbox and click the verification link to activate your account. The link expires in 24 hours.
              </AlertDescription>
            </Alert>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Look in your spam/junk folder if you don't see the email</p>
              <p>You'll receive your User ID (PB#####) after verification</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => setLocation('/auth/login')}
              className="w-full"
              data-testid="button-goto-login"
            >
              <ChevronRight className="h-4 w-4 mr-2" />
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Signup form screen
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center" data-testid="text-signup-title">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Join PAYBACK247 and start earning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* API Error Alert */}
            {error && (
              <Alert variant="destructive" data-testid="alert-api-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                data-testid="input-name"
              />
              {fieldErrors.name && (
                <p className="text-sm text-destructive" data-testid="error-name">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                data-testid="input-email"
              />
              {fieldErrors.email && (
                <p className="text-sm text-destructive" data-testid="error-email">{fieldErrors.email}</p>
              )}
            </div>

            {/* Mobile Field */}
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                placeholder="9876543210"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                data-testid="input-mobile"
              />
              {fieldErrors.mobile && (
                <p className="text-sm text-destructive" data-testid="error-mobile">{fieldErrors.mobile}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                data-testid="input-password"
              />
              {fieldErrors.password && (
                <p className="text-sm text-destructive" data-testid="error-password">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                data-testid="input-confirm-password"
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-destructive" data-testid="error-confirm-password">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Referral Info Alert */}
            {referralData.sponsorId && (
              <Alert data-testid="alert-sponsor-info">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sponsor:</strong> {referralData.sponsorId}
                  {referralData.binaryLeg && (
                    <span className="ml-2"><strong>Leg:</strong> {referralData.binaryLeg.toUpperCase()}</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* reCAPTCHA Widget */}
            {isEnabled && (
              <div className="flex justify-center" data-testid="recaptcha-widget">
                <div ref={recaptchaRef} className="g-recaptcha" />
              </div>
            )}

            {/* Custom CAPTCHA */}
            {systemConfig?.customCaptchaEnabled && (
              <div data-testid="captcha-section">
                <CustomCaptcha
                  onCaptchaChange={(valid) => setCustomCaptchaValid(valid)}
                />
                {fieldErrors.captcha && (
                  <p className="text-sm text-destructive mt-1" data-testid="error-captcha">{fieldErrors.captcha}</p>
                )}
              </div>
            )}

            {/* Terms & Conditions Checkbox */}
            <div className="flex items-start space-x-2" data-testid="checkbox-terms-container">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                disabled={isLoading}
                data-testid="checkbox-terms"
              />
              <div className="flex-1">
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => window.open('/legal/terms', '_blank')}
                    className="text-primary hover:underline"
                    data-testid="link-terms"
                  >
                    Terms & Conditions
                  </button>
                </Label>
                {fieldErrors.terms && (
                  <p className="text-sm text-destructive" data-testid="error-terms">{fieldErrors.terms}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-signup"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>

        {/* Footer */}
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
