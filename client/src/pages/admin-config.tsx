import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Settings, Save, Loader2, Upload, X, Shield, Mail, QrCode, Smartphone, Building2, Copy, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

type SystemConfig = {
  id: string;
  sponsorPaymentAmount: string;
  binaryMatchPaymentAmount: string;
  topRewardAmount: string;
  matrixLevel1Amount: string;
  matrixLevel2Amount: string;
  matrixLevel3Amount: string;
  matrixLevel4Amount: string;
  matrixLevel5Amount: string;
  binaryLeftQualification: number;
  binaryRightQualification: number;
  binaryMatchingRatioLeft: number;
  binaryMatchingRatioRight: number;
  adminName: string | null;
  adminUpiId: string | null;
  adminBankAccount: string | null;
  adminBankHolderName: string | null;
  adminIfscCode: string | null;
  adminMobile: string | null;
  adminQrCodeUrl: string | null;
  recaptchaSiteKey: string | null;
  recaptchaSecretKey: string | null;
  recaptchaEnabled: boolean;
  emailHost: string | null;
  emailPort: number | null;
  emailUser: string | null;
  emailPassword: string | null;
  emailFrom: string | null;
  emailSecure: boolean;
  emailEnabled: boolean;
  updatedAt: string;
};

interface AdminPaymentDetails {
  userId: string;
  name: string | null;
  mobile: string | null;
  upiId: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber?: string | null;
  bankAccount?: string | null;
  ifscCode: string | null;
  paymentQrUrl: string | null;
}

export default function AdminConfig() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [generatedQrCode, setGeneratedQrCode] = useState<string | null>(null);
  const [showGeneratedQR, setShowGeneratedQR] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFullAccount, setShowFullAccount] = useState(false);

  // Fetch system configuration
  const { data: config, isLoading } = useQuery<SystemConfig>({
    queryKey: ['/api/admin/config'],
  });

  // Fetch admin (PB0) payment details from user record
  const { data: paymentDetails, isLoading: isLoadingPayment } = useQuery<AdminPaymentDetails>({
    queryKey: ['/api/admin/payment-details'],
  });

  // Local state for form
  const [formData, setFormData] = useState<Partial<SystemConfig>>({});

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<SystemConfig>) => {
      return await apiRequest('PATCH', '/api/admin/config', data);
    },
    onSuccess: () => {
      // Invalidate both admin and public config caches so frontend refetches
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system-config'] });
      toast({
        title: 'Configuration Updated',
        description: 'System configuration has been saved successfully',
      });
      setFormData({});
      setQrFile(null);
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update configuration. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (to: string) => {
      return await apiRequest('POST', '/api/admin/test-email', { to });
    },
    onSuccess: () => {
      toast({
        title: 'Test Email Sent',
        description: 'Check your inbox! If nothing arrives, verify your SMTP settings.',
      });
      setTestEmail('');
    },
    onError: (error: any) => {
      toast({
        title: 'Test Email Failed',
        description: error.details || 'Failed to send test email. Check your SMTP configuration.',
        variant: 'destructive',
      });
    },
  });

  // Generate QR code mutation
  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/generate-qr', {});
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedQrCode(data.qrCode);
      setShowGeneratedQR(true);
      toast({
        title: 'QR Code Generated',
        description: 'Admin UPI QR code has been generated successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.details || error.error || 'Failed to generate QR code';
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const getValue = (key: keyof SystemConfig): string | number | boolean => {
    const value = formData[key] !== undefined ? formData[key] : config?.[key];
    // Handle boolean values separately
    if (typeof value === 'boolean') return value;
    // Handle null/undefined as empty string for text inputs
    if (value === null || value === undefined) return '';
    return value;
  };

  // Type-safe getters for specific value types
  const getStringValue = (key: keyof SystemConfig): string => {
    const val = getValue(key);
    return typeof val === 'string' ? val : String(val || '');
  };

  const getNumberValue = (key: keyof SystemConfig): number => {
    const val = getValue(key);
    return typeof val === 'number' ? val : 0;
  };

  const getBooleanValue = (key: keyof SystemConfig): boolean => {
    const val = getValue(key);
    return Boolean(val);
  };

  const handleChange = (key: keyof SystemConfig, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: 'Copied to clipboard',
      description: `${field} has been copied`,
    });
  };

  // Mask account number (show only last 4 digits)
  const maskAccount = (account: string | null | undefined): string => {
    if (!account) return '';
    if (showFullAccount) return account;
    if (account.length <= 4) return account;
    return '•'.repeat(account.length - 4) + account.slice(-4);
  };

  const handleSave = async () => {
    setUploading(true);
    
    try {
      let qrCodeUrl = getValue('adminQrCodeUrl') as string;
      
      // Upload QR code if a new file is selected
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

        qrCodeUrl = uploadResponse.publicUrl;
      }

      const dataToSave = {
        ...formData,
        ...(qrCodeUrl && { adminQrCodeUrl: qrCodeUrl }),
      };
      
      updateMutation.mutate(dataToSave);
    } catch (error) {
      console.error('Error uploading QR code:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload QR code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const totalActivationFee: number = [
    getValue('sponsorPaymentAmount'),
    getValue('binaryMatchPaymentAmount'),
    getValue('topRewardAmount'),
    getValue('matrixLevel1Amount'),
    getValue('matrixLevel2Amount'),
    getValue('matrixLevel3Amount'),
    getValue('matrixLevel4Amount'),
    getValue('matrixLevel5Amount'),
  ].reduce((sum: number, amount: string | number) => {
    const numValue = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return sum + (numValue || 0);
  }, 0 as number);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-admin-config">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          System Configuration
        </h1>
        <p className="text-muted-foreground">
          Configure payment amounts, binary matching rules, admin payment details, and security features
        </p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="settings" data-testid="tab-system-settings">
            System Settings
          </TabsTrigger>
          <TabsTrigger value="payment-methods" data-testid="tab-payment-methods">
            Payment Methods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Amounts */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Amounts (₹)</CardTitle>
            <CardDescription>
              Configure individual slot payment amounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sponsorPaymentAmount">Direct Sponsor (Slot 0)</Label>
              <Input
                id="sponsorPaymentAmount"
                type="number"
                step="0.01"
                value={getValue('sponsorPaymentAmount')}
                onChange={(e) => handleChange('sponsorPaymentAmount', e.target.value)}
                data-testid="input-sponsor-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="binaryMatchPaymentAmount">Binary Match (Slot 1)</Label>
              <Input
                id="binaryMatchPaymentAmount"
                type="number"
                step="0.01"
                value={getValue('binaryMatchPaymentAmount')}
                onChange={(e) => handleChange('binaryMatchPaymentAmount', e.target.value)}
                data-testid="input-binary-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topRewardAmount">Top Reward Payment (Slot 2)</Label>
              <Input
                id="topRewardAmount"
                type="number"
                step="0.01"
                value={getValue('topRewardAmount')}
                onChange={(e) => handleChange('topRewardAmount', e.target.value)}
                data-testid="input-top-reward"
              />
            </div>
          </CardContent>
        </Card>

        {/* Matrix Level Amounts */}
        <Card>
          <CardHeader>
            <CardTitle>Matrix Level Amounts (₹)</CardTitle>
            <CardDescription>
              Configure payments for matrix levels 1-5
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((level) => (
              <div key={level} className="space-y-2">
                <Label htmlFor={`matrixLevel${level}Amount`}>Matrix Level {level} (Slot {level + 2})</Label>
                <Input
                  id={`matrixLevel${level}Amount`}
                  type="number"
                  step="0.01"
                  value={getValue(`matrixLevel${level}Amount` as keyof SystemConfig)}
                  onChange={(e) => handleChange(`matrixLevel${level}Amount` as keyof SystemConfig, e.target.value)}
                  data-testid={`input-matrix-${level}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Binary Matching Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Binary Matching Rules</CardTitle>
            <CardDescription>
              Configure binary tree matching requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="binaryLeftQualification">Left Qualification</Label>
                <Input
                  id="binaryLeftQualification"
                  type="number"
                  value={getValue('binaryLeftQualification')}
                  onChange={(e) => handleChange('binaryLeftQualification', parseInt(e.target.value) || 0)}
                  data-testid="input-left-qualification"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="binaryRightQualification">Right Qualification</Label>
                <Input
                  id="binaryRightQualification"
                  type="number"
                  value={getValue('binaryRightQualification')}
                  onChange={(e) => handleChange('binaryRightQualification', parseInt(e.target.value) || 0)}
                  data-testid="input-right-qualification"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="binaryMatchingRatioLeft">Matching Ratio (Left)</Label>
                <Input
                  id="binaryMatchingRatioLeft"
                  type="number"
                  value={getValue('binaryMatchingRatioLeft')}
                  onChange={(e) => handleChange('binaryMatchingRatioLeft', parseInt(e.target.value) || 0)}
                  data-testid="input-ratio-left"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="binaryMatchingRatioRight">Matching Ratio (Right)</Label>
                <Input
                  id="binaryMatchingRatioRight"
                  type="number"
                  value={getValue('binaryMatchingRatioRight')}
                  onChange={(e) => handleChange('binaryMatchingRatioRight', parseInt(e.target.value) || 0)}
                  data-testid="input-ratio-right"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Payment Details */}
        <Card className="md:col-span-2 border-orange-200 bg-orange-50/30 dark:bg-orange-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Admin Payment Details (Deprecated)
            </CardTitle>
            <CardDescription>
              <strong className="text-orange-700 dark:text-orange-400">⚠️ Note:</strong> These fields are deprecated and NO LONGER USED for binary fallback or top reward payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-100/50 dark:bg-orange-950/30">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="space-y-2">
                <p className="font-medium">Payment Details Have Moved!</p>
                <p className="text-sm">
                  Binary fallback payments, top reward payments, and all admin (PB0) payments now use details from the <strong>PB0 user profile</strong>, not from system config.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const tabTrigger = document.querySelector('[data-testid="tab-payment-methods"]') as HTMLElement;
                      tabTrigger?.click();
                    }}
                    data-testid="button-goto-payment-methods"
                  >
                    <Smartphone className="mr-2 h-3 w-3" />
                    View in Payment Methods Tab
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/profile')}
                    data-testid="button-goto-profile-from-deprecated"
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Edit in Profile Page
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60 pointer-events-none">
              <div className="space-y-2">
                <Label htmlFor="adminUpiId">UPI ID *</Label>
                <Input
                  id="adminUpiId"
                  type="text"
                  placeholder="example@upi"
                  value={getValue('adminUpiId')}
                  onChange={(e) => handleChange('adminUpiId', e.target.value)}
                  data-testid="input-admin-upi"
                />
                <p className="text-xs text-muted-foreground">
                  Required for generating QR codes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Name</Label>
                <Input
                  id="adminName"
                  type="text"
                  placeholder="Admin full name"
                  value={getValue('adminName')}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  data-testid="input-admin-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminMobile">Mobile Number</Label>
                <Input
                  id="adminMobile"
                  type="text"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={getValue('adminMobile')}
                  onChange={(e) => handleChange('adminMobile', e.target.value)}
                  data-testid="input-admin-mobile"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminBankAccount">Bank Account Number</Label>
                <Input
                  id="adminBankAccount"
                  type="text"
                  placeholder="Account number"
                  value={getValue('adminBankAccount')}
                  onChange={(e) => handleChange('adminBankAccount', e.target.value)}
                  data-testid="input-admin-bank"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminBankHolderName">Bank Account Holder Name</Label>
                <Input
                  id="adminBankHolderName"
                  type="text"
                  placeholder="Name as per bank account"
                  value={getValue('adminBankHolderName')}
                  onChange={(e) => handleChange('adminBankHolderName', e.target.value)}
                  data-testid="input-admin-bank-holder-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminIfscCode">IFSC Code</Label>
                <Input
                  id="adminIfscCode"
                  type="text"
                  placeholder="11-character IFSC"
                  maxLength={11}
                  value={getValue('adminIfscCode')}
                  onChange={(e) => handleChange('adminIfscCode', e.target.value.toUpperCase())}
                  data-testid="input-admin-ifsc"
                />
              </div>
            </div>

            {/* QR Code Upload */}
            <div className="space-y-2">
              <Label htmlFor="adminQrCode">UPI QR Code</Label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input
                    id="adminQrCode"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                    data-testid="input-admin-qr"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload UPI QR code image (PNG, JPG)
                  </p>
                </div>
                {qrFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQrFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Show current or new QR code */}
              {(qrFile || getValue('adminQrCodeUrl')) && (
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground">Preview:</Label>
                  <div className="border rounded-lg p-2 bg-white inline-block mt-1">
                    <img 
                      src={qrFile ? URL.createObjectURL(qrFile) : (getValue('adminQrCodeUrl') as string)}
                      alt="QR Code Preview" 
                      className="w-32 h-32"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Generate QR Code Section */}
            {getValue('adminUpiId') && (
              <div className="pt-4 border-t">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Generate UPI QR Code</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate a UPI QR code with only your UPI ID (no additional details)
                    </p>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => generateQRMutation.mutate()}
                    disabled={generateQRMutation.isPending}
                    data-testid="button-generate-admin-qr"
                  >
                    {generateQRMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Generate QR Code
                      </>
                    )}
                  </Button>

                  {showGeneratedQR && generatedQrCode && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm font-medium mb-2">Generated UPI QR Code:</p>
                      <img 
                        src={generatedQrCode} 
                        alt="Generated UPI QR Code" 
                        className="mx-auto border-2 border-white rounded-lg shadow-sm" 
                        data-testid="img-generated-admin-qr" 
                      />
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Users can scan this to pay admin • UPI: {getValue('adminUpiId')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Features */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Features
            </CardTitle>
            <CardDescription>
              Configure reCAPTCHA verification for enhanced security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* reCAPTCHA Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="recaptchaEnabled" className="text-base font-medium">
                    Enable reCAPTCHA
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Require CAPTCHA verification on signup and login pages
                  </p>
                </div>
                <Switch
                  id="recaptchaEnabled"
                  checked={!!getValue('recaptchaEnabled')}
                  onCheckedChange={(checked) => handleChange('recaptchaEnabled', checked)}
                  data-testid="switch-recaptcha-enabled"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="recaptchaSiteKey">
                    reCAPTCHA Site Key
                    <span className="text-xs text-muted-foreground ml-1">(v2)</span>
                  </Label>
                  <Input
                    id="recaptchaSiteKey"
                    type="text"
                    placeholder="6Lc..."
                    value={getValue('recaptchaSiteKey')}
                    onChange={(e) => handleChange('recaptchaSiteKey', e.target.value)}
                    data-testid="input-recaptcha-site-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get keys from <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="underline">Google reCAPTCHA</a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recaptchaSecretKey">
                    reCAPTCHA Secret Key
                    <span className="text-xs text-muted-foreground ml-1">(v2)</span>
                  </Label>
                  <Input
                    id="recaptchaSecretKey"
                    type="password"
                    placeholder="6Lc..."
                    value={getValue('recaptchaSecretKey')}
                    onChange={(e) => handleChange('recaptchaSecretKey', e.target.value)}
                    data-testid="input-recaptcha-secret-key"
                  />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email/SMTP Configuration
            </CardTitle>
            <CardDescription>
              Configure email server settings for sending notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="emailEnabled" className="text-base font-medium">
                    Enable Email Service
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send emails for notifications, password resets, and alerts
                  </p>
                </div>
                <Switch
                  id="emailEnabled"
                  checked={!!getValue('emailEnabled')}
                  onCheckedChange={(checked) => handleChange('emailEnabled', checked)}
                  data-testid="switch-email-enabled"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="emailHost">
                    SMTP Server Host
                  </Label>
                  <Input
                    id="emailHost"
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={getValue('emailHost')}
                    onChange={(e) => handleChange('emailHost', e.target.value)}
                    data-testid="input-email-host"
                  />
                  <p className="text-xs text-muted-foreground">
                    SMTP server hostname (e.g., smtp.gmail.com, smtp.sendgrid.net)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailPort">
                    SMTP Port
                  </Label>
                  <Input
                    id="emailPort"
                    type="number"
                    placeholder="587"
                    value={getValue('emailPort')}
                    onChange={(e) => handleChange('emailPort', parseInt(e.target.value) || 587)}
                    data-testid="input-email-port"
                  />
                  <p className="text-xs text-muted-foreground">
                    587 for TLS, 465 for SSL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailUser">
                    SMTP Username
                  </Label>
                  <Input
                    id="emailUser"
                    type="text"
                    placeholder="your-email@example.com"
                    value={getValue('emailUser')}
                    onChange={(e) => handleChange('emailUser', e.target.value)}
                    data-testid="input-email-user"
                  />
                  <p className="text-xs text-muted-foreground">
                    Usually your email address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailPassword">
                    SMTP Password
                  </Label>
                  <Input
                    id="emailPassword"
                    type="password"
                    placeholder="••••••••"
                    value={getValue('emailPassword')}
                    onChange={(e) => handleChange('emailPassword', e.target.value)}
                    data-testid="input-email-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use app-specific password for Gmail
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailFrom">
                    From Email Address
                  </Label>
                  <Input
                    id="emailFrom"
                    type="email"
                    placeholder="noreply@payback247.com"
                    value={getValue('emailFrom')}
                    onChange={(e) => handleChange('emailFrom', e.target.value)}
                    data-testid="input-email-from"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address shown as sender
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-1">
                      <Label htmlFor="emailSecure" className="text-sm font-medium">
                        Use SSL/TLS
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Enable for port 465 (SSL), disable for port 587 (TLS)
                      </p>
                    </div>
                    <Switch
                      id="emailSecure"
                      checked={!!getValue('emailSecure')}
                      onCheckedChange={(checked) => handleChange('emailSecure', checked)}
                      data-testid="switch-email-secure"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Test Email Section */}
            {getValue('emailEnabled') && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="testEmail" className="text-base font-medium">
                    Test Email Configuration
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send a test email to verify your SMTP settings are working correctly
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    data-testid="input-test-email"
                    disabled={testEmailMutation.isPending}
                  />
                  <Button
                    type="button"
                    onClick={() => testEmail && testEmailMutation.mutate(testEmail)}
                    disabled={!testEmail || testEmailMutation.isPending}
                    data-testid="button-send-test-email"
                  >
                    {testEmailMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Test
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods" className="mt-6">
          {isLoadingPayment ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : paymentDetails ? (
            <div className="space-y-6">
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <strong>Sensitive Information:</strong> These are the admin (PB0) payment details where fallback and top reward payments are received. 
                  To modify these details, use the <button onClick={() => navigate('/profile')} className="underline hover:no-underline font-medium" data-testid="link-manage-profile">Profile page</button>.
                </AlertDescription>
              </Alert>

              <div className="grid gap-6 md:grid-cols-2">
                {/* UPI Payment Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      UPI Payment Details
                    </CardTitle>
                    <CardDescription>
                      Unified Payments Interface information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {paymentDetails.upiId ? (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">UPI ID</Label>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono">{paymentDetails.upiId}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(paymentDetails.upiId!, 'UPI ID')}
                              data-testid="button-copy-admin-upi"
                            >
                              {copiedField === 'UPI ID' ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {paymentDetails.mobile && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Mobile Number</Label>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-mono">{paymentDetails.mobile}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(paymentDetails.mobile!, 'Mobile')}
                                data-testid="button-copy-admin-mobile"
                              >
                                {copiedField === 'Mobile' ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {paymentDetails.paymentQrUrl && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">UPI QR Code</Label>
                            <div className="border rounded-lg p-2 bg-white dark:bg-gray-900 inline-block mt-1">
                              <img 
                                src={paymentDetails.paymentQrUrl}
                                alt="Admin UPI QR Code" 
                                className="w-32 h-32"
                                data-testid="img-admin-qr-preview"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          UPI details not configured. Please update via Profile page.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Bank Account Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Bank Account Details
                    </CardTitle>
                    <CardDescription>
                      Bank transfer information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const accountNumber = paymentDetails.bankAccountNumber || paymentDetails.bankAccount;
                      const hasBankDetails = accountNumber && paymentDetails.ifscCode;
                      
                      return hasBankDetails ? (
                        <>
                          {paymentDetails.bankAccountHolder && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Account Holder Name</Label>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{paymentDetails.bankAccountHolder}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(paymentDetails.bankAccountHolder!, 'Account Holder')}
                                  data-testid="button-copy-admin-holder"
                                >
                                  {copiedField === 'Account Holder' ? (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Bank Account Number</Label>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-mono">{maskAccount(accountNumber)}</p>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs px-2"
                                  onClick={() => setShowFullAccount(!showFullAccount)}
                                  data-testid="button-toggle-account"
                                >
                                  {showFullAccount ? 'Hide' : 'Reveal'}
                                </Button>
                                {showFullAccount && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(accountNumber, 'Account Number')}
                                    data-testid="button-copy-admin-account"
                                  >
                                    {copiedField === 'Account Number' ? (
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">IFSC Code</Label>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-mono">{paymentDetails.ifscCode}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(paymentDetails.ifscCode!, 'IFSC Code')}
                                data-testid="button-copy-admin-ifsc"
                              >
                                {copiedField === 'IFSC Code' ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Bank account details not configured. Please update via Profile page.
                          </AlertDescription>
                        </Alert>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Manage Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/profile')}
                  data-testid="button-manage-payment-details"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Payment Details in Profile
                </Button>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load admin payment details. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Summary and Save Button */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Activation Fee</p>
              <p className="text-2xl font-bold">₹{totalActivationFee.toFixed(2)}</p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={updateMutation.isPending || uploading}
              size="lg"
              data-testid="button-save-config"
            >
              {updateMutation.isPending || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
