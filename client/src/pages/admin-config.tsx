import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Settings, Save, Loader2 } from 'lucide-react';

type UpiMethod = {
  upiId: string;
  mobile: string;
  name: string;
};

type BankMethod = {
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  mobile: string;
  bankName: string;
};

type SystemConfig = {
  id: string;
  sponsorPaymentAmount: string;
  binaryMatchPaymentAmount: string;
  creatorFeeAmount: string;
  matrixLevel1Amount: string;
  matrixLevel2Amount: string;
  matrixLevel3Amount: string;
  matrixLevel4Amount: string;
  matrixLevel5Amount: string;
  binaryLeftQualification: number;
  binaryRightQualification: number;
  binaryMatchingRatioLeft: number;
  binaryMatchingRatioRight: number;
  adminUpiMethods: string | null;
  adminBankMethods: string | null;
  updatedAt: string;
};

export default function AdminConfig() {
  const { toast } = useToast();

  // Fetch system configuration
  const { data: config, isLoading } = useQuery<SystemConfig>({
    queryKey: ['/api/admin/config'],
  });

  // Local state for form
  const [formData, setFormData] = useState<Partial<SystemConfig>>({});
  
  // Local state for payment methods
  const [upiMethods, setUpiMethods] = useState<UpiMethod[]>([
    { upiId: '', mobile: '', name: '' },
    { upiId: '', mobile: '', name: '' },
    { upiId: '', mobile: '', name: '' },
  ]);
  
  const [bankMethods, setBankMethods] = useState<BankMethod[]>([
    { accountHolder: '', accountNumber: '', ifscCode: '', mobile: '', bankName: '' },
    { accountHolder: '', accountNumber: '', ifscCode: '', mobile: '', bankName: '' },
    { accountHolder: '', accountNumber: '', ifscCode: '', mobile: '', bankName: '' },
  ]);
  
  // Initialize payment methods from config
  useEffect(() => {
    if (config?.adminUpiMethods) {
      try {
        const parsed = JSON.parse(config.adminUpiMethods);
        if (Array.isArray(parsed)) {
          setUpiMethods([
            parsed[0] || { upiId: '', mobile: '', name: '' },
            parsed[1] || { upiId: '', mobile: '', name: '' },
            parsed[2] || { upiId: '', mobile: '', name: '' },
          ]);
        }
      } catch (e) {
        console.error('Failed to parse UPI methods:', e);
      }
    }
    
    if (config?.adminBankMethods) {
      try {
        const parsed = JSON.parse(config.adminBankMethods);
        if (Array.isArray(parsed)) {
          setBankMethods([
            parsed[0] || { accountHolder: '', accountNumber: '', ifscCode: '', mobile: '', bankName: '' },
            parsed[1] || { accountHolder: '', accountNumber: '', ifscCode: '', mobile: '', bankName: '' },
            parsed[2] || { accountHolder: '', accountNumber: '', ifscCode: '', mobile: '', bankName: '' },
          ]);
        }
      } catch (e) {
        console.error('Failed to parse bank methods:', e);
      }
    }
  }, [config]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<SystemConfig>) => {
      return await apiRequest('PATCH', '/api/admin/config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
      toast({
        title: 'Configuration Updated',
        description: 'System configuration has been saved successfully',
      });
      setFormData({});
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

  const handleSave = () => {
    // Filter out empty payment methods - require ALL fields for each method
    const validUpiMethods = upiMethods.filter(m => 
      m.upiId && m.mobile && m.name
    );
    const validBankMethods = bankMethods.filter(m => 
      m.accountNumber && m.ifscCode && m.accountHolder && m.mobile && m.bankName
    );
    
    const dataToSave = {
      ...formData,
      adminUpiMethods: JSON.stringify(validUpiMethods),
      adminBankMethods: JSON.stringify(validBankMethods),
    };
    
    updateMutation.mutate(dataToSave);
  };

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
          Configure payment amounts, binary matching rules, and admin UPI details
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
              <Label htmlFor="creatorFeeAmount">Creator Fee (Slot 2)</Label>
              <Input
                id="creatorFeeAmount"
                type="number"
                step="0.01"
                value={getValue('creatorFeeAmount')}
                onChange={(e) => handleChange('creatorFeeAmount', e.target.value)}
                data-testid="input-creator-fee"
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
                <Label htmlFor={`matrixLevel${level}Amount`}>
                  Matrix Level {level} (Slot {level + 2})
                </Label>
                <Input
                  id={`matrixLevel${level}Amount`}
                  type="number"
                  step="0.01"
                  value={getValue(`matrixLevel${level}Amount` as keyof SystemConfig)}
                  onChange={(e) => handleChange(`matrixLevel${level}Amount` as keyof SystemConfig, e.target.value)}
                  data-testid={`input-matrix-level-${level}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Binary Matching Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Binary Matching Rules</CardTitle>
            <CardDescription>
              Configure qualification and matching ratio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="binaryLeftQualification">Left Qualification</Label>
                <Input
                  id="binaryLeftQualification"
                  type="number"
                  min="1"
                  value={getValue('binaryLeftQualification')}
                  onChange={(e) => handleChange('binaryLeftQualification', parseInt(e.target.value))}
                  data-testid="input-left-qualification"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="binaryRightQualification">Right Qualification</Label>
                <Input
                  id="binaryRightQualification"
                  type="number"
                  min="1"
                  value={getValue('binaryRightQualification')}
                  onChange={(e) => handleChange('binaryRightQualification', parseInt(e.target.value))}
                  data-testid="input-right-qualification"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="binaryMatchingRatioLeft">Matching Ratio Left</Label>
                <Input
                  id="binaryMatchingRatioLeft"
                  type="number"
                  min="1"
                  value={getValue('binaryMatchingRatioLeft')}
                  onChange={(e) => handleChange('binaryMatchingRatioLeft', parseInt(e.target.value))}
                  data-testid="input-ratio-left"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="binaryMatchingRatioRight">Matching Ratio Right</Label>
                <Input
                  id="binaryMatchingRatioRight"
                  type="number"
                  min="1"
                  value={getValue('binaryMatchingRatioRight')}
                  onChange={(e) => handleChange('binaryMatchingRatioRight', parseInt(e.target.value))}
                  data-testid="input-ratio-right"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Qualification: minimum members required on each leg. 
              Matching Ratio: {getValue('binaryMatchingRatioLeft')}:{getValue('binaryMatchingRatioRight')} 
              determines how binary matches are calculated.
            </p>
          </CardContent>
        </Card>

        {/* Admin UPI Methods */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Admin UPI Payment Methods (Up to 3)</CardTitle>
            <CardDescription>
              Configure UPI IDs for receiving admin payments (Creator Fee, Binary Match)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="grid gap-4 md:grid-cols-3 p-4 border rounded-md">
                <div className="space-y-2">
                  <Label htmlFor={`upi-id-${index}`}>UPI ID {index + 1}</Label>
                  <Input
                    id={`upi-id-${index}`}
                    type="text"
                    placeholder="user@upi"
                    value={upiMethods[index]?.upiId || ''}
                    onChange={(e) => {
                      const updated = [...upiMethods];
                      updated[index] = { ...updated[index], upiId: e.target.value };
                      setUpiMethods(updated);
                    }}
                    data-testid={`input-upi-id-${index}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`upi-mobile-${index}`}>Mobile Number</Label>
                  <Input
                    id={`upi-mobile-${index}`}
                    type="text"
                    placeholder="9876543210"
                    maxLength={10}
                    value={upiMethods[index]?.mobile || ''}
                    onChange={(e) => {
                      const updated = [...upiMethods];
                      updated[index] = { ...updated[index], mobile: e.target.value };
                      setUpiMethods(updated);
                    }}
                    data-testid={`input-upi-mobile-${index}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`upi-name-${index}`}>Account Name</Label>
                  <Input
                    id={`upi-name-${index}`}
                    type="text"
                    placeholder="PAYBACK247"
                    value={upiMethods[index]?.name || ''}
                    onChange={(e) => {
                      const updated = [...upiMethods];
                      updated[index] = { ...updated[index], name: e.target.value };
                      setUpiMethods(updated);
                    }}
                    data-testid={`input-upi-name-${index}`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Admin Bank Methods */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Admin Bank Account Methods (Up to 3)</CardTitle>
            <CardDescription>
              Configure bank accounts for receiving admin payments (Creator Fee, Binary Match)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="grid gap-4 md:grid-cols-5 p-4 border rounded-md">
                <div className="space-y-2">
                  <Label htmlFor={`bank-holder-${index}`}>Account Holder</Label>
                  <Input
                    id={`bank-holder-${index}`}
                    type="text"
                    placeholder="PAYBACK247"
                    value={bankMethods[index]?.accountHolder || ''}
                    onChange={(e) => {
                      const updated = [...bankMethods];
                      updated[index] = { ...updated[index], accountHolder: e.target.value };
                      setBankMethods(updated);
                    }}
                    data-testid={`input-bank-holder-${index}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`bank-number-${index}`}>Account Number</Label>
                  <Input
                    id={`bank-number-${index}`}
                    type="text"
                    placeholder="1234567890"
                    value={bankMethods[index]?.accountNumber || ''}
                    onChange={(e) => {
                      const updated = [...bankMethods];
                      updated[index] = { ...updated[index], accountNumber: e.target.value };
                      setBankMethods(updated);
                    }}
                    data-testid={`input-bank-number-${index}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`bank-ifsc-${index}`}>IFSC Code</Label>
                  <Input
                    id={`bank-ifsc-${index}`}
                    type="text"
                    placeholder="SBIN0001234"
                    maxLength={11}
                    value={bankMethods[index]?.ifscCode || ''}
                    onChange={(e) => {
                      const updated = [...bankMethods];
                      updated[index] = { ...updated[index], ifscCode: e.target.value.toUpperCase() };
                      setBankMethods(updated);
                    }}
                    data-testid={`input-bank-ifsc-${index}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`bank-mobile-${index}`}>Mobile Number</Label>
                  <Input
                    id={`bank-mobile-${index}`}
                    type="text"
                    placeholder="9876543210"
                    maxLength={10}
                    value={bankMethods[index]?.mobile || ''}
                    onChange={(e) => {
                      const updated = [...bankMethods];
                      updated[index] = { ...updated[index], mobile: e.target.value };
                      setBankMethods(updated);
                    }}
                    data-testid={`input-bank-mobile-${index}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`bank-name-${index}`}>Bank Name</Label>
                  <Input
                    id={`bank-name-${index}`}
                    type="text"
                    placeholder="State Bank of India"
                    value={bankMethods[index]?.bankName || ''}
                    onChange={(e) => {
                      const updated = [...bankMethods];
                      updated[index] = { ...updated[index], bankName: e.target.value };
                      setBankMethods(updated);
                    }}
                    data-testid={`input-bank-name-${index}`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending || Object.keys(formData).length === 0}
          data-testid="button-save-config"
        >
          {updateMutation.isPending ? (
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

      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Current Total Activation Fee</CardTitle>
            <CardDescription>Sum of all 8 payment slots</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ₹{(
                parseFloat(config.sponsorPaymentAmount) +
                parseFloat(config.binaryMatchPaymentAmount) +
                parseFloat(config.creatorFeeAmount) +
                parseFloat(config.matrixLevel1Amount) +
                parseFloat(config.matrixLevel2Amount) +
                parseFloat(config.matrixLevel3Amount) +
                parseFloat(config.matrixLevel4Amount) +
                parseFloat(config.matrixLevel5Amount)
              ).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {new Date(config.updatedAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
