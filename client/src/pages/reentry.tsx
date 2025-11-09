import { useState } from 'react';
import { RefreshCw, TrendingUp, AlertCircle, DollarSign, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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

export default function ReentryPage() {
  const [showReentryDialog, setShowReentryDialog] = useState(false);
  const [reentryType, setReentryType] = useState<'automatic' | 'manual'>('automatic');
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
            Please connect your wallet to view re-entry options
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
          <RefreshCw className="w-8 h-8 text-primary" />
          Re-entry Cycles
        </h1>
        <p className="text-muted-foreground">
          Manage your matrix re-entry and continue earning
        </p>
      </div>

      {!isActivated ? (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            You must activate your account before accessing re-entry options.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Matrix Status</CardTitle>
              <CardDescription>Your position in the matrix system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Current Level</p>
                  <p className="text-2xl font-bold">Level {currentLevel}</p>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Matrix Index</p>
                  <p className="text-2xl font-bold">{matrixPosition?.index || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Parent Index</p>
                  <p className="text-2xl font-bold">{matrixPosition?.parentIndex || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Re-entry Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-chart-1" />
                  Automatic Re-entry
                </CardTitle>
                <CardDescription>
                  System automatically re-enters you after cycle completion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                    <span>No manual intervention required</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                    <span>Immediate re-entry after cycle ends</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                    <span>Maximizes earning potential</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                    <span>Uses available balance automatically</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Badge variant="default">Recommended</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-chart-2" />
                  Manual Re-entry
                </CardTitle>
                <CardDescription>
                  You choose when to re-enter the matrix
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                    <span>Full control over re-entry timing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                    <span>Withdraw earnings before re-entry</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                    <span>Flexible payment options</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                    <span>Requires manual activation</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Badge variant="secondary">Flexible</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Re-entry Action */}
          <Card>
            <CardHeader>
              <CardTitle>Initiate Re-entry</CardTitle>
              <CardDescription>
                Re-enter the matrix to continue earning across all levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-md space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Re-entry Fee:</span>
                  <span className="font-semibold">{activationFee || '...'} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Matrix Level:</span>
                  <span className="font-semibold">Level {currentLevel + 1}</span>
                </div>
              </div>

              <Dialog open={showReentryDialog} onOpenChange={setShowReentryDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" data-testid="button-start-reentry">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start Re-entry Process
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Matrix Re-entry</DialogTitle>
                    <DialogDescription>
                      Choose your re-entry type and complete payment
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <RadioGroup value={reentryType} onValueChange={(v) => setReentryType(v as 'automatic' | 'manual')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="automatic" id="automatic" data-testid="radio-automatic" />
                        <Label htmlFor="automatic" className="font-normal">
                          Automatic Re-entry (Recommended)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" data-testid="radio-manual" />
                        <Label htmlFor="manual" className="font-normal">
                          Manual Re-entry
                        </Label>
                      </div>
                    </RadioGroup>

                    <PaymentModeSelector
                      onSuccess={() => {
                        setShowReentryDialog(false);
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Benefits Info */}
          <Card>
            <CardHeader>
              <CardTitle>Re-entry Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
                  <span>Continue earning from all 5 matrix levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
                  <span>Maintain your network and team structure</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
                  <span>Qualify for binary matching income</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
                  <span>Unlock unlimited earning cycles</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Re-entry allows you to continue earning after completing a matrix cycle. Your position and network 
              structure are maintained while you advance to the next earning level.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
