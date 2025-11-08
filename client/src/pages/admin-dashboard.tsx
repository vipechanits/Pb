import { Shield, Users, RefreshCw, GitBranch, FileCheck } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  // todo: remove mock functionality
  const handleUpdateFee = () => {
    console.log('Activation fee updated');
  };

  const handleUpdatePayout = () => {
    console.log('Binary payout updated');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Manage system settings and user activations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value="1,247"
          subtitle="Active accounts"
          icon={Users}
          iconColor="text-primary"
          trend={{ value: '8.2%', positive: true }}
        />
        <StatCard
          title="Total Activations"
          value="892"
          subtitle="Completed"
          icon={Shield}
          iconColor="text-chart-1"
        />
        <StatCard
          title="Matrix Cycles"
          value="156"
          subtitle="Total re-entries"
          icon={RefreshCw}
          iconColor="text-chart-2"
        />
        <StatCard
          title="Binary Pairs Matched"
          value="3,421"
          subtitle="All time"
          icon={GitBranch}
          iconColor="text-chart-3"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activation Fee Settings</CardTitle>
            <CardDescription>Set the activation fee in USDT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activation-fee">Activation Fee (USDT)</Label>
              <Input
                id="activation-fee"
                type="number"
                defaultValue="50"
                placeholder="50"
                data-testid="input-activation-fee"
              />
              <p className="text-sm text-muted-foreground">Current: 50 USDT (₹5,000 INR)</p>
            </div>
            <Button onClick={handleUpdateFee} data-testid="button-update-fee">
              Update Fee
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Binary Pair Payout</CardTitle>
            <CardDescription>Set the payout per matched pair in USDT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pair-payout">Pair Payout (USDT)</Label>
              <Input
                id="pair-payout"
                type="number"
                defaultValue="10"
                placeholder="10"
                data-testid="input-pair-payout"
              />
              <p className="text-sm text-muted-foreground">Current: 10 USDT (₹1,000 INR)</p>
            </div>
            <Button onClick={handleUpdatePayout} data-testid="button-update-payout">
              Update Payout
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Binary Matching Criteria</CardTitle>
          <CardDescription>Configure binary qualification and matching rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Qualification Criteria</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qual-left">Left Required</Label>
                  <Input id="qual-left" type="number" defaultValue="1" data-testid="input-qual-left" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qual-right">Right Required</Label>
                  <Input id="qual-right" type="number" defaultValue="1" data-testid="input-qual-right" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Matching Criteria</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="match-left">Left Match</Label>
                  <Input id="match-left" type="number" defaultValue="3" data-testid="input-match-left" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="match-right">Right Match</Label>
                  <Input id="match-right" type="number" defaultValue="3" data-testid="input-match-right" />
                </div>
              </div>
            </div>
          </div>
          <Button className="mt-4" data-testid="button-update-criteria">
            Update Criteria
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>Pending Payment Confirmations</CardTitle>
            <CardDescription>Offline payments awaiting approval</CardDescription>
          </div>
          <Badge variant="destructive" className="text-sm">
            5 Pending
          </Badge>
        </CardHeader>
        <CardContent>
          <Button variant="outline" data-testid="button-view-payments">
            <FileCheck className="w-4 h-4 mr-2" />
            View All Payments
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
