import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema } from '@shared/schema';
import type { UpdateProfile } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, QrCode, X, Upload } from 'lucide-react';
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

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
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

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" data-testid="tab-profile">Profile Details</TabsTrigger>
          <TabsTrigger value="referrals" data-testid="tab-referrals">Referral Links</TabsTrigger>
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
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" maxLength={10} {...field} data-testid="input-mobile" />
                    </FormControl>
                    <FormDescription>10-digit mobile number without country code</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>UPI Payment Details</CardTitle>
              <CardDescription>For receiving payments via UPI</CardDescription>
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
                    <FormDescription>Your UPI ID for Google Pay, Paytm, or PhonePe</FormDescription>
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
              <CardTitle>Bank Account Details</CardTitle>
              <CardDescription>For receiving payments via bank transfer</CardDescription>
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
      </Tabs>
    </div>
  );
}
