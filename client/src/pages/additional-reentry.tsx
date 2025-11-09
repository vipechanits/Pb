import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Info, CheckCircle, Clock } from 'lucide-react';

export default function AdditionalReentryPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Additional Reentry</h1>
        <p className="text-muted-foreground">
          Purchase extra matrix positions beyond automatic reentries
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>What is Additional Reentry?</AlertTitle>
        <AlertDescription>
          While standard reentry happens after completing a cycle, additional reentry lets you 
          purchase extra matrix positions anytime to multiply your earning potential.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Current matrix slots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Additional Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Extra positions purchased</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Awaiting admin approval</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Additional Position</CardTitle>
          <CardDescription>Expand your earning potential with extra matrix slots</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Additional Matrix Position</h4>
              <Badge>₹7,000</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get a new 2+5 matrix position that runs parallel to your existing ones. Each position 
              can earn up to ₹38,750 from all levels.
            </p>
            <Button className="w-full" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Request Additional Position
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Additional Reentry Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. Request Position</h4>
            <p className="text-muted-foreground">Submit a request for an additional matrix position</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Admin Approval</h4>
            <p className="text-muted-foreground">Admin reviews your request and compliance status</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Pay Entry Fee</h4>
            <p className="text-muted-foreground">₹7,000 to activate your new matrix position</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Multiple Income Streams</h4>
            <p className="text-muted-foreground">Each position fills independently, multiplying your earnings</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benefits of Multiple Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Parallel Earnings</p>
                <p className="text-sm text-muted-foreground">Each position earns independently</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Faster Growth</p>
                <p className="text-sm text-muted-foreground">Multiple matrices fill simultaneously</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Compounding Returns</p>
                <p className="text-muted-foreground text-sm">Reinvest earnings into more positions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Position History</CardTitle>
          <CardDescription>Your additional reentry records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            No additional positions yet
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
