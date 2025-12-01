import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Mail, Lock, Hash } from 'lucide-react';
import { useRecaptcha } from '@/hooks/use-recaptcha';
import { apiRequest } from '@/lib/queryClient';
import { CustomCaptcha } from '@/components/custom-captcha';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, loginWithPin } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loginMode, setLoginMode] = useState<'password' | 'pin'>('password');
  // Separate error/loading state per mode to prevent cross-mode contamination
  const [passwordError, setPasswordError] = useState('');
  const [pinError, setPinError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [customCaptchaValid, setCustomCaptchaValid] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const { isLoaded, isEnabled, renderRecaptcha, executeRecaptcha } = useRecaptcha();
  const { data: systemConfig } = useQuery({
    queryKey: ['/api/system-config'],
  }) as any;

  // Render reCAPTCHA when loaded
  useEffect(() => {
    if (isLoaded && isEnabled && recaptchaRef.current) {
      renderRecaptcha(recaptchaRef.current);
    }
  }, [isLoaded, isEnabled, renderRecaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequiresVerification(false);
    setResendSuccess('');

    // Validate custom CAPTCHA if enabled
    if (systemConfig?.customCaptchaEnabled && !customCaptchaValid) {
      setPasswordError('Please complete the security verification');
      return;
    }

    try {
      if (loginMode === 'pin') {
        // Clear PIN-specific state
        setPinError('');
        setPinLoading(true);
        
        // PIN login using loginWithPin helper (matches password login pattern)
        const user = await loginWithPin(userId, pin);
        
        // Redirect based on role
        if (user.role === 'admin') {
          setLocation('/admin/dashboard');
        } else {
          setLocation('/user/dashboard');
        }
      } else {
        // Clear password-specific state
        setPasswordError('');
        setPasswordLoading(true);
        
        // Password login with reCAPTCHA
        let recaptchaToken = '';
        if (isEnabled) {
          try {
            recaptchaToken = await executeRecaptcha();
          } catch (err: any) {
            setPasswordError(err.message || 'Please complete the reCAPTCHA verification');
            setPasswordLoading(false);
            return;
          }
        }

        const user = await login(userId, password, recaptchaToken);
        // Redirect based on role returned from login
        if (user.role === 'admin') {
          setLocation('/admin/dashboard');
        } else {
          setLocation('/user/dashboard');
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to log in';
      
      // Set error in mode-specific state
      if (loginMode === 'pin') {
        setPinError(errorMessage);
      } else {
        setPasswordError(errorMessage);
      }
      
      // Check if backend response includes requiresVerification flag
      if (err.requiresVerification === true) {
        setRequiresVerification(true);
        // Store the email from backend response for resend functionality
        if (err.email) {
          setUnverifiedEmail(err.email);
        }
      }
      
      // Reset reCAPTCHA on error (only for password login)
      if (loginMode === 'password' && isEnabled && window.grecaptcha) {
        window.grecaptcha.reset();
      }
    } finally {
      // Clear loading state for the appropriate mode
      if (loginMode === 'pin') {
        setPinLoading(false);
      } else {
        setPasswordLoading(false);
      }
    }
  };

  const handleResendVerification = async () => {
    // Use email from backend response if available, otherwise fall back to form input
    const emailToResend = unverifiedEmail || email;
    
    if (!emailToResend) {
      if (loginMode === 'password') {
        setPasswordError('Email address is required to resend verification');
      } else {
        setPinError('Email address is required to resend verification');
      }
      return;
    }
    
    setResendingEmail(true);
    setResendSuccess('');
    setPasswordError('');
    setPinError('');
    
    try {
      const result = await apiRequest('POST', '/api/auth/resend-verification', { email: emailToResend }) as unknown as { message: string };
      setResendSuccess(result.message);
      setRequiresVerification(false);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to resend verification email';
      if (loginMode === 'password') {
        setPasswordError(errorMsg);
      } else {
        setPinError(errorMsg);
      }
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
          <Tabs value={loginMode} onValueChange={(value) => {
            setLoginMode(value as 'password' | 'pin');
            // Clear form fields when switching modes to prevent cross-mode contamination
            setPassword('');
            setPin('');
            setPasswordError('');
            setPinError('');
            setRequiresVerification(false);
            setResendSuccess('');
          }} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password" data-testid="tab-password">
                <Lock className="mr-2 h-4 w-4" />
                Password
              </TabsTrigger>
              <TabsTrigger value="pin" data-testid="tab-pin">
                <Hash className="mr-2 h-4 w-4" />
                6-Digit PIN
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Show mode-specific error */}
              {(loginMode === 'password' ? passwordError : pinError) && (
                <Alert variant="destructive" data-testid="alert-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginMode === 'password' ? passwordError : pinError}</AlertDescription>
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
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="e.g., PB10001"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.toUpperCase())}
                  required
                  data-testid="input-userId"
                />
              </div>

              <TabsContent value="password" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={loginMode === 'password'}
                    data-testid="input-password"
                  />
                </div>

                {/* reCAPTCHA Widget */}
                {isEnabled && (
                  <div className="flex justify-center">
                    <div ref={recaptchaRef} className="g-recaptcha" data-testid="recaptcha-widget"></div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pin" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="pin">6-Digit PIN</Label>
                  <Input
                    id="pin"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setPin(value);
                    }}
                    maxLength={6}
                    required={loginMode === 'pin'}
                    data-testid="input-pin"
                  />
                  <p className="text-xs text-muted-foreground">
                    Don't have a PIN? Log in with password and set up PIN in Account Settings.
                  </p>
                </div>
              </TabsContent>

              {/* Custom CAPTCHA */}
              <CustomCaptcha 
                onCaptchaChange={setCustomCaptchaValid} 
                onCodeChange={setCaptchaCode}
                data-testid="custom-captcha-login"
              />

              <Button type="submit" className="w-full" disabled={loginMode === 'password' ? passwordLoading : pinLoading} data-testid="button-login">
                {(loginMode === 'password' ? passwordLoading : pinLoading) ? 'Logging in...' : loginMode === 'pin' ? 'Log In with PIN' : 'Log In'}
              </Button>
            </form>
          </Tabs>
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
