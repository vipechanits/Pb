import { useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import PaymentModeSelector from '@/components/PaymentModeSelector';
import { useActivationData, useActivationFee } from '@/hooks/useBlockchainData';
import { useWeb3 } from '@/context/Web3Context';
import { Skeleton } from '@/components/ui/skeleton';

export default function ActivationPage() {
  const [, setLocation] = useLocation();
  const { isConnected, account } = useWeb3();
  const { data: activationData, isLoading } = useActivationData();
  const { data: activationFee } = useActivationFee();

  if (!isConnected) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please connect your wallet to view activation status
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isActivated = activationData?.activated || false;
  const hasPendingActivation = activationData?.hasActivation && !activationData?.activated;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Activation</h1>
        <p className="text-muted-foreground">
          Activate your PAYBACK247 account to start earning
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Activation Status</CardTitle>
          <CardDescription>Current status of your account activation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-md">
            <div className="flex items-center gap-3">
              {isActivated ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-semibold">Account Activated</p>
                    <p className="text-sm text-muted-foreground">
                      Your account is active and earning
                    </p>
                  </div>
                </>
              ) : hasPendingActivation ? (
                <>
                  <Clock className="w-6 h-6 text-yellow-500" />
                  <div>
                    <p className="font-semibold">Activation Pending</p>
                    <p className="text-sm text-muted-foreground">
                      Waiting for admin confirmation
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="font-semibold">Not Activated</p>
                    <p className="text-sm text-muted-foreground">
                      Complete activation to start earning
                    </p>
                  </div>
                </>
              )}
            </div>
            <Badge variant={isActivated ? 'default' : hasPendingActivation ? 'secondary' : 'outline'}>
              {isActivated ? 'Active' : hasPendingActivation ? 'Pending' : 'Inactive'}
            </Badge>
          </div>

          {activationData && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Activation Fee:</span>
                <span className="font-semibold">{activationFee || '...'} USDT</span>
              </div>
              {activationData.hasActivation && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <span className="font-semibold">
                      {activationData.paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verification:</span>
                    <span className="font-semibold">
                      {activationData.verifiedOnchain ? 'Verified On-Chain' : 'Pending Verification'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activation Form */}
      {!isActivated && (
        <div>
          {hasPendingActivation ? (
            <Alert>
              <Clock className="w-4 h-4" />
              <AlertDescription>
                Your activation payment is pending admin confirmation. You will be notified once approved.
              </AlertDescription>
            </Alert>
          ) : (
            <PaymentModeSelector
              onSuccess={() => {
                setLocation('/user');
              }}
            />
          )}
        </div>
      )}

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Activation Benefits</CardTitle>
          <CardDescription>What you get when you activate</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
              <span>Access to Direct Sponsoring income</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
              <span>Binary Matching income (3:3 FIFO)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
              <span>5-Level Matrix income distribution</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
              <span>Automatic and manual re-entry options</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
              <span>Unlimited earning potential</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {isActivated && (
        <div className="flex justify-center">
          <Button onClick={() => setLocation('/user')} data-testid="button-go-dashboard">
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
