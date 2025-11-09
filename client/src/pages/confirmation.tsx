import { CheckCircle, Clock, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useActivationData } from '@/hooks/useBlockchainData';
import { useWeb3 } from '@/context/Web3Context';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConfirmationPage() {
  const { isConnected } = useWeb3();
  const { data: activationData, isLoading } = useActivationData();

  if (!isConnected) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please connect your wallet to view payment confirmation
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

  const hasActivation = activationData?.hasActivation || false;
  const isActivated = activationData?.activated || false;
  const isPaid = activationData?.paid || false;
  const isVerified = activationData?.verifiedOnchain || false;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Confirmation</h1>
        <p className="text-muted-foreground">
          Track your payment verification status
        </p>
      </div>

      {!hasActivation ? (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            No activation payment found. Please complete your activation first.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>Current status of your payment verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  {isActivated && isVerified ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="font-semibold">Verified & Activated</p>
                        <p className="text-sm text-muted-foreground">
                          Your payment is confirmed on-chain
                        </p>
                      </div>
                    </>
                  ) : isPaid ? (
                    <>
                      <Clock className="w-6 h-6 text-yellow-500" />
                      <div>
                        <p className="font-semibold">Under Verification</p>
                        <p className="text-sm text-muted-foreground">
                          Payment received, awaiting admin confirmation
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-500" />
                      <div>
                        <p className="font-semibold">Pending Payment</p>
                        <p className="text-sm text-muted-foreground">
                          Awaiting payment confirmation
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <Badge 
                  variant={
                    isActivated && isVerified ? 'default' : 
                    isPaid ? 'secondary' : 
                    'outline'
                  }
                >
                  {isActivated && isVerified ? 'Verified' : isPaid ? 'Reviewing' : 'Pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Information about your activation payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">Payment Mode</span>
                  <span className="font-semibold text-sm">
                    {activationData?.modes?.[0] === 0 ? 'Web3 (On-Chain)' : 'Offline Payment'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">Payment Status</span>
                  <Badge variant={isPaid ? 'default' : 'outline'}>
                    {isPaid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">On-Chain Verification</span>
                  <Badge variant={isVerified ? 'default' : 'outline'}>
                    {isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">Account Status</span>
                  <Badge variant={isActivated ? 'default' : 'outline'}>
                    {isActivated ? 'Activated' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {activationData?.proofs?.[0] && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Payment Proof</p>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Proof URL:</p>
                    <a 
                      href={activationData.proofs[0]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                      data-testid="link-payment-proof"
                    >
                      View Payment Proof
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribution Details */}
          {activationData?.receivers && activationData.receivers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Distribution</CardTitle>
                <CardDescription>How your activation fee is distributed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activationData.receivers.map((receiver: string, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-muted rounded-md text-sm"
                    >
                      <span className="font-mono text-xs">{receiver.slice(0, 6)}...{receiver.slice(-4)}</span>
                      <span className="font-semibold">{activationData.amounts?.[index]} USDT</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasActivation ? 'bg-primary' : 'bg-muted'}`}>
                      <CheckCircle className={`w-4 h-4 ${hasActivation ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="w-0.5 h-12 bg-border"></div>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-sm">Payment Submitted</p>
                    <p className="text-xs text-muted-foreground">Payment proof or transaction submitted</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPaid ? 'bg-primary' : 'bg-muted'}`}>
                      <CheckCircle className={`w-4 h-4 ${isPaid ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="w-0.5 h-12 bg-border"></div>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-sm">Payment Received</p>
                    <p className="text-xs text-muted-foreground">Admin confirms payment receipt</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isVerified ? 'bg-primary' : 'bg-muted'}`}>
                      <CheckCircle className={`w-4 h-4 ${isVerified ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="w-0.5 h-12 bg-border"></div>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-sm">On-Chain Verification</p>
                    <p className="text-xs text-muted-foreground">Transaction verified on blockchain</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActivated ? 'bg-primary' : 'bg-muted'}`}>
                      <CheckCircle className={`w-4 h-4 ${isActivated ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-sm">Account Activated</p>
                    <p className="text-xs text-muted-foreground">Account is now active and earning</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isActivated && (
            <Alert>
              <Clock className="w-4 h-4" />
              <AlertDescription>
                Your payment is under review. Activation typically completes within 24-48 hours for offline payments, 
                or instantly for Web3 payments once confirmed on-chain.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
