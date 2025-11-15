import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Settings, Save, Loader2, Upload, X } from 'lucide-react';

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
  adminUpiId: string | null;
  adminBankAccount: string | null;
  adminIfscCode: string | null;
  adminMobile: string | null;
  adminQrCodeUrl: string | null;
  updatedAt: string;
};

export default function AdminConfig() {
  const { toast } = useToast();
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch system configuration
  const { data: config, isLoading } = useQuery<SystemConfig>({
    queryKey: ['/api/admin/config'],
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

  const getValue = (key: keyof SystemConfig) => {
    const value = formData[key] !== undefined ? formData[key] : config?.[key];
    return value === null ? '' : value || '';
  };

  const handleChange = (key: keyof SystemConfig, value: string | number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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
          Configure payment amounts, binary matching rules, and admin payment details
        </p>
      </div>

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
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Admin Payment Details</CardTitle>
            <CardDescription>
              Configure admin UPI and bank account for receiving payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminUpiId">UPI ID</Label>
                <Input
                  id="adminUpiId"
                  type="text"
                  placeholder="example@upi"
                  value={getValue('adminUpiId')}
                  onChange={(e) => handleChange('adminUpiId', e.target.value)}
                  data-testid="input-admin-upi"
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
          </CardContent>
        </Card>
      </div>

      {/* Summary and Save Button */}
      <Card>
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
