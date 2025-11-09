import { useState } from 'react';
import { Plus, RefreshCw, AlertCircle, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useActivationData, useMatrixPosition, useActivationFee } from '@/hooks/useBlockchainData';
import { useWeb3 } from '@/context/Web3Context';
import { Skeleton } from '@/components/ui/skeleton';
import PaymentModeSelector from '@/components/PaymentModeSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdditionalReentryPage() {
  const [showDialog, setShowDialog] = useState(false);
  const { isConnected } = useWeb3();
  const { data: activationData, isLoading: activationLoading } = useActivationData();
  const { data: matrixPosition, isLoading: matrixLoading } = useMatrixPosition();
  const { data: activationFee } = useActivationFee();

  if (!isConnected) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please connect your wallet to view additional re-entry options
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (activationLoading || matrixLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isActivated = activationData?.activated || false;
  const currentLevel = matrixPosition?.level || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Plus className="w-8 h-8 text-primary" />
          Additional Re-entry
        </h1>
        <p className="text-muted-foreground">
          Create additional positions for increased earning potential
        </p>
      </div>

      {!isActivated ? (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            You must activate your account before creating additional re-entries.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>What is Additional Re-entry?</CardTitle>
              <CardDescription>
                Multiply your earning positions in the matrix
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Additional re-entry allows you to purchase multiple positions in the matrix system, 
                effectively multiplying your earning potential across all income streams.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-md">
                  <TrendingUp className="w-6 h-6 text-primary mb-2" />
                  <p className="font-semibold text-sm">Multiple Positions</p>
                  <p className="text-xs text-muted-foreground">Hold several matrix positions simultaneously</p>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <DollarSign className="w-6 h-6 text-chart-1 mb-2" />
                  <p className="font-semibold text-sm">Increased Income</p>
                  <p className="text-xs text-muted-foreground">Earn from multiple positions at once</p>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <RefreshCw className="w-6 h-6 text-chart-2 mb-2" />
                  <p className="font-semibold text-sm">Faster Cycles</p>
                  <p className="text-xs text-muted-foreground">Complete matrix cycles more quickly</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Positions */}
          <Card>
            <CardHeader>
              <CardTitle>Your Current Positions</CardTitle>
              <CardDescription>Active matrix positions and earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold">Primary Position</p>
                    <p className="text-sm text-muted-foreground">Matrix Index: {matrixPosition?.index || 0}</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Level</p>
                    <p className="font-semibold">Level {currentLevel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Parent Index</p>
                    <p className="font-semibold">{matrixPosition?.parentIndex || 0}</p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Additional positions will be displayed here once created. Each position earns independently 
                  from direct sponsoring, binary matching, and matrix income.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Position Pricing</CardTitle>
              <CardDescription>Investment required for new positions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-chart-1/10 rounded-lg border-2 border-primary/20">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Per Additional Position</p>
                  <p className="text-4xl font-bold text-primary">{activationFee || '...'} USDT</p>
                  <p className="text-xs text-muted-foreground">Same as activation fee</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-3 bg-muted rounded-md">
                  <span className="text-muted-foreground">2 Positions Total</span>
                  <span className="font-semibold">{activationFee ? (parseFloat(activationFee) * 2).toFixed(2) : '...'} USDT</span>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-md">
                  <span className="text-muted-foreground">3 Positions Total</span>
                  <span className="font-semibold">{activationFee ? (parseFloat(activationFee) * 3).toFixed(2) : '...'} USDT</span>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-md">
                  <span className="text-muted-foreground">5 Positions Total</span>
                  <span className="font-semibold">{activationFee ? (parseFloat(activationFee) * 5).toFixed(2) : '...'} USDT</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Button */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Additional Position</CardTitle>
              <CardDescription>
                Create a new matrix position to increase your earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg" data-testid="button-purchase-position">
                    <Plus className="w-4 h-4 mr-2" />
                    Purchase New Position
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Purchase Additional Position</DialogTitle>
                    <DialogDescription>
                      Complete payment to create a new earning position
                    </DialogDescription>
                  </DialogHeader>
                  <PaymentModeSelector
                    onSuccess={() => {
                      setShowDialog(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Benefits of Multiple Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Multiplied Income Streams</p>
                    <p className="text-muted-foreground">Earn from direct sponsoring, binary, and matrix for each position</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Independent Positions</p>
                    <p className="text-muted-foreground">Each position earns separately and cycles independently</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Accelerated Growth</p>
                    <p className="text-muted-foreground">Fill matrix positions faster with multiple active slots</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Network Leverage</p>
                    <p className="text-muted-foreground">Maximize earnings from your existing team</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Same Price Structure</p>
                    <p className="text-muted-foreground">Additional positions cost the same as initial activation</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <p className="font-semibold mb-1">Important Information</p>
              <p className="text-sm">
                Each additional position requires the full activation fee and operates independently in the matrix. 
                All positions benefit from your referral network and team structure. Consider your strategy carefully 
                before creating multiple positions.
              </p>
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
