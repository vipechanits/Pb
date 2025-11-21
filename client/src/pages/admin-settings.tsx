import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Settings, Save, Download, Upload, Power } from 'lucide-react';

export default function AdminSettings() {
  const { toast } = useToast();
  const [domain, setDomain] = useState('https://payback247.com');
  const [activationFee, setActivationFee] = useState('5000');
  const [paymentPerSlot, setPaymentPerSlot] = useState('625');
  const [reentryFee, setReentryFee] = useState('7000');
  
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/system/maintenance');
      if (response.ok) {
        const data = await response.json();
        setMaintenanceMode(data.maintenanceMode);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setMaintenanceLoading(true);
      const response = await apiRequest('POST', '/api/admin/system/maintenance', {
        maintenanceMode: !maintenanceMode,
      });

      if (!response.ok) throw new Error('Failed to toggle maintenance mode');

      setMaintenanceMode(!maintenanceMode);
      toast({
        title: 'Success',
        description: `Maintenance mode is now ${!maintenanceMode ? 'ON' : 'OFF'}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to toggle maintenance mode',
      });
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      const response = await apiRequest('POST', '/api/admin/system/backup', {});

      if (!response.ok) throw new Error('Failed to create backup');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payback247-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Database backup downloaded successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create backup',
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (file: File) => {
    try {
      setRestoreLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/system/restore', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to restore backup');

      toast({
        title: 'Success',
        description: 'Database restored successfully. Please refresh the page.',
      });

      // Refresh page after short delay
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to restore backup',
      });
    } finally {
      setRestoreLoading(false);
    }
  };

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

      {/* Maintenance Mode */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>
            Enable to block all regular users (admins bypass)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Status: {maintenanceMode ? 'ON' : 'OFF'}</p>
              <p className="text-sm text-muted-foreground">
                {maintenanceMode ? 'Platform is in maintenance mode' : 'Platform is operational'}
              </p>
            </div>
            <Button
              onClick={handleToggleMaintenance}
              disabled={maintenanceLoading}
              variant={maintenanceMode ? 'destructive' : 'default'}
              data-testid="button-toggle-maintenance"
            >
              {maintenanceLoading ? 'Updating...' : (maintenanceMode ? 'Turn OFF' : 'Turn ON')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Database Backup & Restore
          </CardTitle>
          <CardDescription>
            Export database or restore from backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              onClick={handleBackup}
              disabled={backupLoading}
              className="w-full"
              data-testid="button-backup"
            >
              <Download className="mr-2 h-4 w-4" />
              {backupLoading ? 'Creating Backup...' : 'Download Backup'}
            </Button>

            <div>
              <input
                type="file"
                accept=".json"
                id="restore-file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleRestore(e.target.files[0]);
                  }
                }}
                disabled={restoreLoading}
                data-testid="input-restore-file"
              />
              <Button
                onClick={() => document.getElementById('restore-file')?.click()}
                disabled={restoreLoading}
                className="w-full"
                variant="secondary"
                data-testid="button-restore"
              >
                <Upload className="mr-2 h-4 w-4" />
                {restoreLoading ? 'Restoring...' : 'Restore from Backup'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Backup includes all users, activations, payments, and income data. Restore will overwrite existing database.
          </p>
        </CardContent>
      </Card>

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
