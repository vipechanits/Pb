import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfileSchema, updateEmailSchema, updatePasswordSchema, setupPinSchema } from '@shared/schema';
import type { UpdateProfile, UpdateEmailRequest, UpdatePasswordRequest, SetupPinRequest } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, QrCode, AlertTriangle, Mail, Lock, Shield, Hash } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ReferralLinks } from '@/components/referral-links';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Show profile completion dialog on first visit
  useEffect(() => {
    if (user && !user.isProfileComplete) {
      const hasSeenDialog = localStorage.getItem('profile-completion-dialog-seen');
      const lastSeenTime = hasSeenDialog ? parseInt(hasSeenDialog) : 0;
      const now = Date.now();
      const hoursSinceLastSeen = (now - lastSeenTime) / (1000 * 60 * 60);
      
      // Show dialog if never seen or if more than 24 hours have passed
      if (!hasSeenDialog || hoursSinceLastSeen > 24) {
        setShowProfileDialog(true);
      }
    }
  }, [user]);

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      mobile: user?.mobile || '',
      upiId: user?.upiId || '',
      bankAccountHolder: user?.bankAccountHolder || '',
      bankAccountNumber: user?.bankAccountNumber || '',
      ifscCode: user?.ifscCode || '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        mobile: user.mobile || '',
        upiId: user.upiId || '',
        bankAccountHolder: user.bankAccountHolder || '',
        bankAccountNumber: user.bankAccountNumber || '',
        ifscCode: user.ifscCode || '',
      });
    }
  }, [user, form]);
  const onSubmit = async (data: UpdateProfile) => {
    setLoading(true);
    
    try {
      await apiRequest('PATCH', '/api/profile', data);
      await refreshUser();
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      const response = await apiRequest('POST', '/api/profile/generate-qr');
      const data = await response.json();
      setQrCode(data.qrCode);
      setShowQR(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate QR code. Make sure you have filled in your UPI ID.',
        variant: 'destructive',
      });
    }
  };

  const handleDialogClose = (open: boolean) => {
    setShowProfileDialog(open);
    // Save to localStorage whenever dialog closes (any method: button, overlay, escape)
    if (!open) {
      localStorage.setItem('profile-completion-dialog-seen', Date.now().toString());
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Completion Alert Dialog */}
      <AlertDialog open={showProfileDialog} onOpenChange={handleDialogClose}>
        <AlertDialogContent data-testid="dialog-profile-completion">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Complete Your Profile to Unlock Activations
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-base">
                <p className="font-semibold text-foreground">
                  Your profile is incomplete. Complete it now to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Activate your PAYBACK247 account</strong> and start earning</li>
                  <li><strong className="text-foreground">Receive payments</strong> from your network via UPI or bank transfer</li>
                  <li><strong className="text-foreground">Process withdrawals</strong> without delays</li>
                  <li><strong className="text-foreground">Build your referral network</strong> and maximize income</li>
                </ul>
                <p className="text-destructive font-semibold">
                  ⚠️ Incomplete payment details will delay your withdrawals and prevent activation.
                </p>
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-semibold text-sm text-muted-foreground">Required Information:</p>
                  <ul className="text-sm space-y-1 mt-2 text-muted-foreground">
                    <li>✓ Full Name & Mobile Number</li>
                    <li>✓ UPI ID or Bank Account Details</li>
                    <li>✓ Payment QR Code (optional but recommended)</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => handleDialogClose(false)} data-testid="button-dialog-understand" className="w-full">
              I Understand - Let Me Complete My Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div>
        <h1 className="text-3xl font-bold" data-testid="text-profile-title">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your payment details, account information, and referral links</p>
      </div>

      {user?.userId && (
        <Alert className="bg-primary/10 border-primary/20">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <span className="font-semibold">User ID:</span> {user.userId}
          </AlertDescription>
        </Alert>
      )}

      {/* Persistent Warning Banner for Incomplete Profile */}
      {user && !user.isProfileComplete && (
        <Alert variant="destructive" className="border-2 border-destructive" data-testid="alert-profile-incomplete">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">⚠️ ACTION REQUIRED: Complete Your Profile</AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="font-semibold">
              Your profile is incomplete. Fill in all required payment details below to unlock account activation and receive payments.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const nameInput = document.querySelector('[data-testid="input-name"]') as HTMLInputElement;
                  nameInput?.focus();
                  nameInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                data-testid="button-scroll-to-profile"
                className="bg-background hover:bg-background/90"
              >
                Complete Profile Now →
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={user?.role === 'admin' ? "grid w-full grid-cols-4" : "grid w-full grid-cols-3"}>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile Details</TabsTrigger>
          <TabsTrigger value="referrals" data-testid="tab-referrals">Referral Links</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="fallback-payments" data-testid="tab-fallback-payments">Fallback Payments</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Full Name
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground">Required for profile completion</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Mobile Number
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" maxLength={10} {...field} data-testid="input-mobile" />
                    </FormControl>
                    <FormDescription>10-digit mobile number without country code (required)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                UPI Payment Details
                <Badge variant="secondary" className="text-xs">At least one payment method required</Badge>
              </CardTitle>
              <CardDescription>For receiving payments via UPI (Recommended)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI ID</FormLabel>
                    <FormControl>
                      <Input placeholder="yourname@paytm" {...field} data-testid="input-upi-id" />
                    </FormControl>
                    <FormDescription>Your UPI ID for Google Pay, Paytm, or PhonePe (fill this OR bank details below)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {user?.upiId && user?.name && user?.mobile && (
                <div className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateQRCode}
                    data-testid="button-generate-qr"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate UPI QR Code
                  </Button>

                  {showQR && qrCode && (
                    <div className="mt-4 p-4 border rounded-lg bg-white dark:bg-card">
                      <p className="text-sm font-medium mb-2">Your UPI QR Code:</p>
                      <img src={qrCode} alt="UPI QR Code" className="mx-auto" data-testid="img-qr-code" />
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Users can scan this to pay you
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Bank Account Details
                <Badge variant="secondary" className="text-xs">Alternative payment method</Badge>
              </CardTitle>
              <CardDescription>For receiving payments via bank transfer (if you don't have UPI)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="bankAccountHolder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Holder Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-account-holder" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} data-testid="input-account-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl>
                      <Input placeholder="SBIN0001234" maxLength={11} {...field} data-testid="input-ifsc" />
                    </FormControl>
                    <FormDescription>11-character bank IFSC code</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  data-testid="button-save-profile"
                  className="w-full sm:w-auto min-w-[200px]"
                  size="lg"
                >
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralLinks />
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <SecuritySettings />
        </TabsContent>

        {user?.role === 'admin' && (
          <TabsContent value="fallback-payments" className="space-y-6 mt-6">
            <FallbackPaymentSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function SecuritySettings() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [securityCodeLoading, setSecurityCodeLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const securityCodeForm = useForm({
    resolver: zodResolver(z.object({
      securityCode: z.string().length(6, "Security code must be exactly 6 digits").regex(/^\d{6}$/, "Security code must contain only digits"),
      confirmSecurityCode: z.string().length(6, "Security code must be exactly 6 digits").regex(/^\d{6}$/, "Security code must contain only digits"),
    }).refine((data) => data.securityCode === data.confirmSecurityCode, {
      message: "Security codes do not match",
      path: ["confirmSecurityCode"],
    })),
    defaultValues: {
      securityCode: '',
      confirmSecurityCode: '',
    },
  });

  const emailForm = useForm<UpdateEmailRequest>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: {
      newEmail: '',
      securityCode: '',
    },
  });

  const passwordForm = useForm<UpdatePasswordRequest>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      newPassword: '',
      securityCode: '',
    },
  });

  const pinForm = useForm<SetupPinRequest>({
    resolver: zodResolver(setupPinSchema),
    defaultValues: {
      pin: '',
      securityCode: '',
    },
  });

  const onSecurityCodeSubmit = async (data: { securityCode: string; confirmSecurityCode: string }) => {
    setSecurityCodeLoading(true);
    try {
      await apiRequest('POST', '/api/auth/setup-security-code', data);
      await refreshUser();
      securityCodeForm.reset();
      toast({
        title: 'Security code set up',
        description: 'Your 6-digit security code has been successfully set up. You can now use it for account security features.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set up security code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSecurityCodeLoading(false);
    }
  };

  const onEmailSubmit = async (data: UpdateEmailRequest) => {
    setEmailLoading(true);
    try {
      await apiRequest('PATCH', '/api/profile/email', data);
      await refreshUser();
      emailForm.reset();
      toast({
        title: 'Email updated',
        description: 'Your email address has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const onPasswordSubmit = async (data: UpdatePasswordRequest) => {
    setPasswordLoading(true);
    try {
      await apiRequest('PATCH', '/api/profile/password', data);
      passwordForm.reset();
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully updated. A confirmation email has been sent.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const onPinSubmit = async (data: SetupPinRequest) => {
    setPinLoading(true);
    try {
      await apiRequest('POST', '/api/auth/setup-pin', data);
      await refreshUser();
      pinForm.reset();
      toast({
        title: 'PIN setup successful',
        description: 'Your 6-digit PIN has been set up successfully. You can now use it for quick login.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set up PIN. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Setup Security Code (Required First) */}
      {!user?.securityCode && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <Shield className="h-5 w-5" />
              Setup Security Code (Required)
            </CardTitle>
            <CardDescription>
              Set up your 6-digit security code first. This is required to use email updates, password changes, and PIN login features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...securityCodeForm}>
              <form onSubmit={securityCodeForm.handleSubmit(onSecurityCodeSubmit)} className="space-y-4">
                <FormField
                  control={securityCodeForm.control}
                  name="securityCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>6-Digit Security Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          inputMode="numeric"
                          placeholder="123456"
                          maxLength={6}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            field.onChange(value);
                          }}
                          disabled={securityCodeLoading}
                          data-testid="input-security-code"
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a 6-digit code (0-9 only) that you can remember
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={securityCodeForm.control}
                  name="confirmSecurityCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Security Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          inputMode="numeric"
                          placeholder="123456"
                          maxLength={6}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            field.onChange(value);
                          }}
                          disabled={securityCodeLoading}
                          data-testid="input-confirm-security-code"
                        />
                      </FormControl>
                      <FormDescription>
                        Re-enter your security code to confirm
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={securityCodeLoading}
                  data-testid="button-setup-security-code"
                >
                  {securityCodeLoading ? 'Setting up...' : 'Setup Security Code'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {user?.securityCode && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Security code is active. You can now use all security features.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Update Email Address
          </CardTitle>
          <CardDescription>
            Change your email address. You'll need your 6-digit security code to confirm this change.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Current email: <span className="font-medium text-foreground">{user?.email}</span></p>
              </div>

              <FormField
                control={emailForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="newemail@example.com"
                        disabled={emailLoading || !user?.securityCode}
                        data-testid="input-new-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={emailForm.control}
                name="securityCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6-Digit Security Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        disabled={emailLoading || !user?.securityCode}
                        data-testid="input-email-security-code"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your 6-digit security code to confirm this change
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={emailLoading || !user?.securityCode}
                data-testid="button-update-email"
              >
                {emailLoading ? 'Updating...' : 'Update Email'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Update Password
          </CardTitle>
          <CardDescription>
            Change your password. You'll need your 6-digit security code instead of your old password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter new password"
                        disabled={passwordLoading || !user?.securityCode}
                        data-testid="input-new-password"
                      />
                    </FormControl>
                    <FormDescription>
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="securityCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6-Digit Security Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        disabled={passwordLoading || !user?.securityCode}
                        data-testid="input-password-security-code"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your 6-digit security code to confirm this change
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={passwordLoading || !user?.securityCode}
                data-testid="button-update-password"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Setup 6-Digit PIN for Quick Login
          </CardTitle>
          <CardDescription>
            {user?.pinHash 
              ? "Your PIN is already set up. You can update it by entering a new PIN below." 
              : "Set up a 6-digit PIN for faster login. You'll need your security code to set this up."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.pinHash && (
            <Alert className="mb-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                PIN is currently active. You can use it for quick login.
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...pinForm}>
            <form onSubmit={pinForm.handleSubmit(onPinSubmit)} className="space-y-4">
              <FormField
                control={pinForm.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6-Digit PIN</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit PIN"
                        maxLength={6}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          field.onChange(value);
                        }}
                        disabled={pinLoading || !user?.securityCode}
                        data-testid="input-pin"
                      />
                    </FormControl>
                    <FormDescription>
                      Must be exactly 6 digits (0-9 only)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={pinForm.control}
                name="securityCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6-Digit Security Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        disabled={pinLoading || !user?.securityCode}
                        data-testid="input-pin-security-code"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your 6-digit security code to confirm this change
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={pinLoading || !user?.securityCode}
                data-testid="button-setup-pin"
              >
                {pinLoading ? 'Setting up...' : user?.pinHash ? 'Update PIN' : 'Setup PIN'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Forgot Your Password?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If you've forgotten your password, you can reset it using your email address.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/auth/forgot-password'}
            data-testid="button-forgot-password"
          >
            <Mail className="mr-2 h-4 w-4" />
            Reset Password via Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


function FallbackPaymentSettings() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"top-reward" | "binary-fallback" | "matrix-fallback">("top-reward");
  const [qrCodeGenerating, setQrCodeGenerating] = useState(false);

  // State for each fallback type
  const [topRewardData, setTopRewardData] = useState({
    holderName: user?.topRewardHolderName || "",
    mobile: user?.topRewardMobile || "",
    bankAccount: user?.topRewardBankAccount || "",
    ifsc: user?.topRewardIfsc || "",
    upiId: user?.topRewardUpiId || "",
  });

  const [binaryFallbackData, setBinaryFallbackData] = useState({
    holderName: user?.binaryFallbackHolderName || "",
    mobile: user?.binaryFallbackMobile || "",
    bankAccount: user?.binaryFallbackBankAccount || "",
    ifsc: user?.binaryFallbackIfsc || "",
    upiId: user?.binaryFallbackUpiId || "",
  });

  const [matrixFallbackData, setMatrixFallbackData] = useState({
    holderName: user?.matrixFallbackHolderName || "",
    mobile: user?.matrixFallbackMobile || "",
    bankAccount: user?.matrixFallbackBankAccount || "",
    ifsc: user?.matrixFallbackIfsc || "",
    upiId: user?.matrixFallbackUpiId || "",
  });

  useEffect(() => {
    if (user) {
      setTopRewardData({
        holderName: user.topRewardHolderName || "",
        mobile: user.topRewardMobile || "",
        bankAccount: user.topRewardBankAccount || "",
        ifsc: user.topRewardIfsc || "",
        upiId: user.topRewardUpiId || "",
      });

      setBinaryFallbackData({
        holderName: user.binaryFallbackHolderName || "",
        mobile: user.binaryFallbackMobile || "",
        bankAccount: user.binaryFallbackBankAccount || "",
        ifsc: user.binaryFallbackIfsc || "",
        upiId: user.binaryFallbackUpiId || "",
      });

      setMatrixFallbackData({
        holderName: user.matrixFallbackHolderName || "",
        mobile: user.matrixFallbackMobile || "",
        bankAccount: user.matrixFallbackBankAccount || "",
        ifsc: user.matrixFallbackIfsc || "",
        upiId: user.matrixFallbackUpiId || "",
      });
    }
  }, [user]);

  const saveFallbackPayments = async (type: "top_reward" | "binary_fallback" | "matrix_fallback") => {
    try {
      let data;
      if (type === "top_reward") {
        data = {
          topRewardHolderName: topRewardData.holderName,
          topRewardMobile: topRewardData.mobile,
          topRewardBankAccount: topRewardData.bankAccount,
          topRewardIfsc: topRewardData.ifsc,
          topRewardUpiId: topRewardData.upiId,
        };
      } else if (type === "binary_fallback") {
        data = {
          binaryFallbackHolderName: binaryFallbackData.holderName,
          binaryFallbackMobile: binaryFallbackData.mobile,
          binaryFallbackBankAccount: binaryFallbackData.bankAccount,
          binaryFallbackIfsc: binaryFallbackData.ifsc,
          binaryFallbackUpiId: binaryFallbackData.upiId,
        };
      } else {
        data = {
          matrixFallbackHolderName: matrixFallbackData.holderName,
          matrixFallbackMobile: matrixFallbackData.mobile,
          matrixFallbackBankAccount: matrixFallbackData.bankAccount,
          matrixFallbackIfsc: matrixFallbackData.ifsc,
          matrixFallbackUpiId: matrixFallbackData.upiId,
        };
      }

      await apiRequest("PATCH", "/api/profile/fallback-payments", data);
      await refreshUser();

      toast({
        title: "Payment details saved",
        description: `${type.replace("_", " ").toUpperCase()} payment details have been successfully updated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save payment details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateQR = async (type: "top_reward" | "binary_fallback" | "matrix_fallback") => {
    setQrCodeGenerating(true);
    try {
      await apiRequest("POST", "/api/profile/generate-fallback-qr", { type });
      await refreshUser();
      toast({
        title: "QR Code generated",
        description: "UPI QR code has been successfully generated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code. Make sure you have filled in the UPI ID.",
        variant: "destructive",
      });
    } finally {
      setQrCodeGenerating(false);
    }
  };

  const renderPaymentForm = (
    type: "top_reward" | "binary_fallback" | "matrix_fallback",
    data: typeof topRewardData,
    setData: React.Dispatch<React.SetStateAction<typeof topRewardData>>,
    qrUrl?: string | null
  ) => {
    const title = type === "top_reward" 
      ? "Top Reward Payment"
      : type === "binary_fallback"
      ? "Binary Fallback Payment"
      : "Matrix Upline Fallback Payment";

    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            <strong>What is this?</strong> These payment details are used when {
              type === "top_reward"
                ? "users make top reward payments (Slot 2)"
                : type === "binary_fallback"
                ? "binary match queue is empty (Slot 1 fallback to admin)"
                : "matrix uplines are unavailable (Slot 3-7 fallback to admin)"
            }.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Account Holder Information</CardTitle>
            <CardDescription>Name and contact details for this payment type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Holder Name</label>
              <Input
                placeholder="Full name as per bank account"
                value={data.holderName}
                onChange={(e) => setData({ ...data, holderName: e.target.value })}
                data-testid={`input-${type}-holder-name`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mobile Number</label>
              <Input
                placeholder="10-digit mobile number"
                maxLength={10}
                value={data.mobile}
                onChange={(e) => setData({ ...data, mobile: e.target.value })}
                data-testid={`input-${type}-mobile`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Account Details</CardTitle>
            <CardDescription>For receiving payments via bank transfer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank Account Number</label>
              <Input
                placeholder="Account number"
                value={data.bankAccount}
                onChange={(e) => setData({ ...data, bankAccount: e.target.value })}
                data-testid={`input-${type}-bank-account`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">IFSC Code</label>
              <Input
                placeholder="11-character IFSC code"
                maxLength={11}
                value={data.ifsc}
                onChange={(e) => setData({ ...data, ifsc: e.target.value.toUpperCase() })}
                data-testid={`input-${type}-ifsc`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>UPI Payment Details</CardTitle>
            <CardDescription>For receiving payments via UPI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">UPI ID</label>
              <Input
                placeholder="yourname@upi"
                value={data.upiId}
                onChange={(e) => setData({ ...data, upiId: e.target.value })}
                data-testid={`input-${type}-upi-id`}
              />
            </div>

            {data.upiId && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => generateQR(type)}
                  disabled={qrCodeGenerating}
                  data-testid={`button-${type}-generate-qr`}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  {qrCodeGenerating ? "Generating..." : "Generate UPI QR Code"}
                </Button>
              </div>
            )}

            {qrUrl && (
              <div className="mt-4 p-4 border rounded-lg bg-white dark:bg-card inline-block">
                <p className="text-sm font-medium mb-2">QR Code Preview:</p>
                <img src={qrUrl} alt="UPI QR Code" className="w-32 h-32" data-testid={`img-${type}-qr`} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <Button
              onClick={() => saveFallbackPayments(type)}
              className="w-full"
              data-testid={`button-save-${type}`}
            >
              Save {title} Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Alert className="border-primary/20 bg-primary/5">
        <AlertTitle>Admin Fallback Payment Configuration</AlertTitle>
        <AlertDescription>
          Configure separate payment details for each fallback type. These are used when payments need to be routed to the admin (PB0) due to queue being empty or uplines unavailable.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="top-reward" data-testid="tab-top-reward">Top Reward</TabsTrigger>
          <TabsTrigger value="binary-fallback" data-testid="tab-binary-fallback">Binary Fallback</TabsTrigger>
          <TabsTrigger value="matrix-fallback" data-testid="tab-matrix-fallback">Matrix Fallback</TabsTrigger>
        </TabsList>

        <TabsContent value="top-reward" className="mt-6">
          {renderPaymentForm("top_reward", topRewardData, setTopRewardData, user?.topRewardQrUrl)}
        </TabsContent>

        <TabsContent value="binary-fallback" className="mt-6">
          {renderPaymentForm("binary_fallback", binaryFallbackData, setBinaryFallbackData, user?.binaryFallbackQrUrl)}
        </TabsContent>

        <TabsContent value="matrix-fallback" className="mt-6">
          {renderPaymentForm("matrix_fallback", matrixFallbackData, setMatrixFallbackData, user?.matrixFallbackQrUrl)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
