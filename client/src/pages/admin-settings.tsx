import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save } from 'lucide-react';

export default function AdminSettings() {
  const { toast } = useToast();
  const [domain, setDomain] = useState('https://payback247.com');
  const [activationFee, setActivationFee] = useState('5000');
  const [paymentPerSlot, setPaymentPerSlot] = useState('625');
  const [reentryFee, setReentryFee] = useState('7000');

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Payment configuration has been updated successfully',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          System Settings
        </h1>
        <p className="text-muted-foreground">
          Configure platform settings and payment parameters
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Referral Domain Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Link Domain</CardTitle>
            <CardDescription>
              Set the custom domain for referral links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain URL</Label>
              <Input
                id="domain"
                type="text"
                placeholder="https://example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Current: {domain}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Configuration</CardTitle>
            <CardDescription>
              Configure activation and payment amounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activationFee">Total Activation Fee (₹)</Label>
              <Input
                id="activationFee"
                type="number"
                placeholder="5000"
                value={activationFee}
                onChange={(e) => setActivationFee(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentPerSlot">Payment Per Slot (₹)</Label>
              <Input
                id="paymentPerSlot"
                type="number"
                placeholder="625"
                value={paymentPerSlot}
                onChange={(e) => setPaymentPerSlot(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Amount paid for each of the 8 activation slots
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reentryFee">Reentry Fee (₹)</Label>
              <Input
                id="reentryFee"
                type="number"
                placeholder="7000"
                value={reentryFee}
                onChange={(e) => setReentryFee(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Configure accepted payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Google Pay</h3>
              <p className="text-sm text-muted-foreground">UPI payments via Google Pay</p>
              <div className="mt-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Enabled
                </span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Paytm</h3>
              <p className="text-sm text-muted-foreground">UPI and wallet payments</p>
              <div className="mt-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Enabled
                </span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">PhonePe</h3>
              <p className="text-sm text-muted-foreground">UPI payments via PhonePe</p>
              <div className="mt-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Enabled
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Wallet */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Wallet Configuration</CardTitle>
          <CardDescription>
            Platform admin payment receiving details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adminUpi">Admin UPI ID</Label>
              <Input
                id="adminUpi"
                type="text"
                placeholder="admin@upi"
                defaultValue="payback247@upi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminMobile">Admin Mobile</Label>
              <Input
                id="adminMobile"
                type="text"
                placeholder="+91 1234567890"
                defaultValue="+91 9876543210"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
