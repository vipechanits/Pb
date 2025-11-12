import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Info, XCircle } from 'lucide-react';
import { useSystemConfig, formatINR } from '@/hooks/use-system-config';

export default function ReentryPage() {
  const { config } = useSystemConfig();
  
  const reentryStats = [
    {
      title: 'Completed Cycles',
      value: '0',
      description: 'Full matrix completions',
    },
    {
      title: 'Active Cycle',
      value: 'Not Started',
      description: 'Current progress',
    },
    {
      title: 'Total Earnings',
      value: '₹0',
      description: 'All cycles combined',
    },
    {
      title: 'Reentry Available',
      value: 'No',
      description: 'Eligibility status',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Reentry System</h1>
        <p className="text-muted-foreground">
          Compound your earnings by reentering the matrix
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>What is Reentry?</AlertTitle>
        <AlertDescription>
          When you complete your 2+5 matrix cycle (62 positions filled), you can reenter the system 
          by paying {formatINR(config.totalActivationCost)} to start a new cycle and continue earning from matrix positions infinitely.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reentryStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reentry Eligibility</CardTitle>
          <CardDescription>Requirements to reenter the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Complete Current Matrix</p>
                <p className="text-sm text-muted-foreground">All 62 positions in your 2+5 matrix must be filled</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Receive All Payments</p>
                <p className="text-sm text-muted-foreground">All matrix income payments must be confirmed</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Account in Good Standing</p>
                <p className="text-sm text-muted-foreground">No pending disputes or compliance issues</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Reentry Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. Complete Your Cycle</h4>
            <p className="text-muted-foreground">Earn from all 62 matrix positions ({formatINR(config.totalMatrixPotential)} total income)</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Pay Reentry Fee</h4>
            <p className="text-muted-foreground">{formatINR(config.totalActivationCost)} to start a fresh 2+5 matrix cycle</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. New Cycle Begins</h4>
            <p className="text-muted-foreground">Your matrix resets and you start receiving payments from new positions</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Compound Earnings</h4>
            <p className="text-muted-foreground">Each cycle earns {formatINR(config.totalMatrixPotential - config.totalActivationCost)}+ profit ({formatINR(config.totalMatrixPotential)} - {formatINR(config.totalActivationCost)} reentry)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reentry History</CardTitle>
          <CardDescription>Your past reentry cycles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            No reentry cycles yet
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ready to Reenter?</CardTitle>
          <CardDescription>Complete your current cycle to unlock reentry</CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reentry Not Available
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Complete your current matrix cycle to enable reentry
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
