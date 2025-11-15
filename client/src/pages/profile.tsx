import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, updateEmailSchema, updatePasswordSchema } from '@shared/schema';
import type { UpdateProfile, UpdateEmailRequest, UpdatePasswordRequest } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, QrCode, X, Upload, AlertTriangle, Mail, Lock, Shield } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ReferralLinks } from '@/components/referral-links';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { Label } from '@/components/ui/label';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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
    setUploading(true);
    
    try {
      let paymentQrUrl = data.paymentQrUrl;
      
      // Upload QR file if selected
      if (qrFile) {
        const response = await apiRequest('POST', '/api/objects/upload', {
          filename: qrFile.name,
          contentType: qrFile.type,
        });
        const uploadResponse = await response.json() as { uploadUrl: string; publicUrl: string };

        // Upload file to presigned URL
        await fetch(uploadResponse.uploadUrl, {
          method: 'PUT',
          body: qrFile,
          headers: {
            'Content-Type': qrFile.type,
          },
        });

        paymentQrUrl = uploadResponse.publicUrl;
      }
      
      await apiRequest('PATCH', '/api/profile', { ...data, paymentQrUrl });
      await refreshUser();
      setQrFile(null);
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
      setUploading(false);
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
        description: 'Failed to generate QR code. Make sure you have filled in your UPI ID, name, and mobile number.',
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" data-testid="tab-profile">Profile Details</TabsTrigger>
          <TabsTrigger value="referrals" data-testid="tab-referrals">Referral Links</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
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

              {/* QR Code Upload */}
              <div className="space-y-2">
                <Label htmlFor="paymentQrCode">Upload UPI QR Code (Optional)</Label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <Input
                      id="paymentQrCode"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                      data-testid="input-user-qr"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload your UPI QR code image (PNG, JPG)
                    </p>
                  </div>
                  {qrFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setQrFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Show current or new QR code */}
                {(qrFile || user?.paymentQrUrl) && (
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Preview:</Label>
                    <div className="border rounded-lg p-2 bg-white inline-block mt-1">
                      <img 
                        src={qrFile ? URL.createObjectURL(qrFile) : (user?.paymentQrUrl || '')}
                        alt="QR Code Preview" 
                        className="w-32 h-32"
                      />
                    </div>
                  </div>
                )}
              </div>

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

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} data-testid="button-save-profile">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralLinks />
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SecuritySettings() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState<string>('');
  const [twoFAQR, setTwoFAQR] = useState<string>('');
  const [showTwoFASetup, setShowTwoFASetup] = useState(false);
  const [twoFAToken, setTwoFAToken] = useState('');
  const [disableTwoFAToken, setDisableTwoFAToken] = useState('');

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

  const handleInitiate2FA = async () => {
    setTwoFALoading(true);
    try {
      const response = await apiRequest('POST', '/api/2fa/setup');
      const data = await response.json();
      setTwoFASecret(data.secret);
      setTwoFAQR(data.qrCode);
      setShowTwoFASetup(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate 2FA setup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!twoFAToken || twoFAToken.length !== 6) {
      toast({
        title: 'Invalid Token',
        description: 'Please enter a valid 6-digit code from your authenticator app.',
        variant: 'destructive',
      });
      return;
    }

    setTwoFALoading(true);
    try {
      await apiRequest('POST', '/api/2fa/enable', { token: twoFAToken });
      await refreshUser();
      setShowTwoFASetup(false);
      setTwoFAToken('');
      setTwoFASecret('');
      setTwoFAQR('');
      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication has been successfully enabled for your account.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable 2FA. Please check your code and try again.',
        variant: 'destructive',
      });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disableTwoFAToken || disableTwoFAToken.length !== 6) {
      toast({
        title: 'Invalid Token',
        description: 'Please enter a valid 6-digit code from your authenticator app.',
        variant: 'destructive',
      });
      return;
    }

    setTwoFALoading(true);
    try {
      await apiRequest('POST', '/api/2fa/disable', { token: disableTwoFAToken });
      await refreshUser();
      setDisableTwoFAToken('');
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled for your account.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable 2FA. Please check your code and try again.',
        variant: 'destructive',
      });
    } finally {
      setTwoFALoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!user?.securityCode && (
        <Alert variant="destructive" data-testid="alert-no-security-code">
          <Shield className="h-4 w-4" />
          <AlertTitle>Security Code Required</AlertTitle>
          <AlertDescription>
            You need to set up your 6-digit security code in your profile before you can update your email or password.
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

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA using an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                Two-Factor Authentication is {user?.twoFactorEnabled ? 'enabled' : 'disabled'}
              </p>
            </div>
            <Badge variant={user?.twoFactorEnabled ? 'default' : 'secondary'} data-testid="badge-2fa-status">
              {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          {!user?.twoFactorEnabled && !showTwoFASetup && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">How to Enable 2FA:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Click "Enable 2FA" to generate a QR code</li>
                  <li>Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>Enter the 6-digit code from your app to confirm</li>
                </ol>
              </div>
              <Button
                onClick={handleInitiate2FA}
                disabled={twoFALoading}
                data-testid="button-enable-2fa"
              >
                {twoFALoading ? 'Loading...' : 'Enable 2FA'}
              </Button>
            </div>
          )}

          {showTwoFASetup && (
            <div className="space-y-4">
              <Alert data-testid="alert-2fa-setup">
                <Shield className="h-4 w-4" />
                <AlertTitle>Setup Two-Factor Authentication</AlertTitle>
                <AlertDescription>
                  Scan the QR code below with your authenticator app, then enter the 6-digit code to complete setup.
                </AlertDescription>
              </Alert>

              {twoFAQR && (
                <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg bg-white dark:bg-card">
                  <img src={twoFAQR} alt="2FA QR Code" className="w-48 h-48" data-testid="img-2fa-qr" />
                  <div className="text-center space-y-2 w-full">
                    <p className="text-sm font-medium">Manual Entry Key:</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded block break-all" data-testid="text-2fa-secret">
                      {twoFASecret}
                    </code>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="twoFAToken">Enter 6-Digit Code</Label>
                <Input
                  id="twoFAToken"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={twoFAToken}
                  onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, ''))}
                  disabled={twoFALoading}
                  data-testid="input-2fa-token"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the code from your authenticator app
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleEnable2FA}
                  disabled={twoFALoading || twoFAToken.length !== 6}
                  data-testid="button-confirm-2fa"
                >
                  {twoFALoading ? 'Verifying...' : 'Confirm & Enable 2FA'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTwoFASetup(false);
                    setTwoFAToken('');
                    setTwoFASecret('');
                    setTwoFAQR('');
                  }}
                  disabled={twoFALoading}
                  data-testid="button-cancel-2fa-setup"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {user?.twoFactorEnabled && (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>2FA is Active</AlertTitle>
                <AlertDescription>
                  Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when logging in.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="disableTwoFAToken">Enter 6-Digit Code to Disable</Label>
                <Input
                  id="disableTwoFAToken"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={disableTwoFAToken}
                  onChange={(e) => setDisableTwoFAToken(e.target.value.replace(/\D/g, ''))}
                  disabled={twoFALoading}
                  data-testid="input-disable-2fa-token"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a code from your authenticator app to disable 2FA
                </p>
              </div>

              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={twoFALoading || disableTwoFAToken.length !== 6}
                data-testid="button-disable-2fa"
              >
                {twoFALoading ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </div>
          )}
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
