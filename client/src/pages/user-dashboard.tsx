import { useState } from 'react';
import { DollarSign, Users, GitBranch, Grid3x3, RefreshCw, ArrowLeftRight, Share2, Link2, ExternalLink, Layers, Plus } from 'lucide-react';
import StatCard from '@/components/StatCard';
import PaymentModeSelector from '@/components/PaymentModeSelector';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useWeb3 } from '@/context/Web3Context';
import { useActivationData, useBinaryReport, useActivationFee, useMatrixPosition, useCreatorCards } from '@/hooks/useBlockchainData';
import WalletButton from '@/components/WalletButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useContract } from '@/hooks/useContract';

interface PaymentProof {
  transactionId: string;
  proofUrl: string;
  status: 'pending' | 'paid' | 'resubmit';
}

const USDT_TO_INR = 100;

const formatDualCurrency = (usdtAmount: string | number | null | undefined): string => {
  if (usdtAmount === null || usdtAmount === undefined || usdtAmount === '') {
    return '...';
  }
  
  const usdt = typeof usdtAmount === 'string' ? parseFloat(usdtAmount) : usdtAmount;
  
  if (isNaN(usdt) || !isFinite(usdt)) {
    return '...';
  }
  
  const inr = (usdt * USDT_TO_INR).toFixed(2);
  return `${usdt.toFixed(2)} USDT (₹${inr})`;
};

const formatINR = (usdtAmount: string | number | null | undefined): string => {
  if (usdtAmount === null || usdtAmount === undefined || usdtAmount === '') {
    return '₹0.00';
  }
  
  const usdt = typeof usdtAmount === 'string' ? parseFloat(usdtAmount) : usdtAmount;
  
  if (isNaN(usdt) || !isFinite(usdt)) {
    return '₹0.00';
  }
  
  const inr = (usdt * USDT_TO_INR).toFixed(2);
  return `₹${inr}`;
};

export default function UserDashboard() {
  const [showActivation, setShowActivation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState<'left' | 'right' | null>(null);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>(
    Array.from({ length: 8 }, () => ({ transactionId: '', proofUrl: '', status: 'pending' }))
  );
  const [individualPaymentStatus, setIndividualPaymentStatus] = useState<Record<number, 'pending' | 'paid'>>(
    Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i, 'pending']))
  );
  const { account, isConnected } = useWeb3();
  const { data: activationData, isLoading: activationLoading } = useActivationData();
  const { data: binaryData, isLoading: binaryLoading } = useBinaryReport();
  const { data: activationFee } = useActivationFee();
  const { data: matrixPosition } = useMatrixPosition();
  const { data: creatorCards } = useCreatorCards();
  const { toast } = useToast();
  const { approveUSDT, paySlotWeb3, submitOfflineProof, isLoading } = useContract();


  if (!isConnected) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Dashboard</h1>
          <WalletButton />
        </div>
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please connect your wallet to view your dashboard
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isActivated = activationData?.activated || false;
  const binaryIncome = binaryData?.accruedUSDT || '0';
  const directLeft = binaryData?.directLeft || 0;
  const directRight = binaryData?.directRight || 0;
  const pairsMatched = binaryData?.pairsMatched || 0;
  const userId = matrixPosition?.index !== undefined ? `PB${matrixPosition.index}` : null;
  
  const sponsoringIncome = '0';
  const matrixIncome = '0';
  const reentryIncome = '0';
  const additionalReentryIncome = '0';
  
  const totalIncome = (
    parseFloat(binaryIncome) +
    parseFloat(sponsoringIncome) +
    parseFloat(matrixIncome) +
    parseFloat(reentryIncome) +
    parseFloat(additionalReentryIncome)
  ).toString();

  const copyUserId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      setCopied(true);
      toast({
        title: "Copied!",
        description: `User ID ${userId} copied to clipboard`,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyAffiliateLink = (side: 'left' | 'right') => {
    if (account) {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/?ref=${account}&side=${side}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(side);
      toast({
        title: "Link Copied!",
        description: `${side === 'left' ? 'Left' : 'Right'} referral link copied to clipboard`,
      });
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handlePaymentProofChange = (index: number, field: 'transactionId' | 'proofUrl', value: string) => {
    setPaymentProofs(prev => {
      const newProofs = [...prev];
      newProofs[index] = { ...newProofs[index], [field]: value };
      return newProofs;
    });
  };

  const handleSubmitProof = async (index: number) => {
    const proof = paymentProofs[index];
    if (!proof.transactionId || !proof.proofUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide both transaction ID and proof URL",
        variant: "destructive",
      });
      return;
    }

    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    const receipt = await submitOfflineProof(index, proof.transactionId, proof.proofUrl);
    
    if (receipt) {
      setPaymentProofs(prev => {
        const newProofs = [...prev];
        newProofs[index] = { ...newProofs[index], status: 'paid' };
        return newProofs;
      });
    } else {
      setPaymentProofs(prev => {
        const newProofs = [...prev];
        newProofs[index] = { ...newProofs[index], status: 'resubmit' };
        return newProofs;
      });
    }
  };

  const handleIndividualPayment = async (index: number) => {
    if (!account || !activationData?.receivers || !activationData?.amounts) {
      toast({
        title: "Cannot Process Payment",
        description: "Missing required payment information",
        variant: "destructive",
      });
      return;
    }

    const amount = activationData.amounts[index];

    const approvalReceipt = await approveUSDT(amount);
    
    if (!approvalReceipt) {
      return;
    }

    const paymentReceipt = await paySlotWeb3(index);
    
    if (paymentReceipt) {
      setIndividualPaymentStatus(prev => ({ ...prev, [index]: 'paid' }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">User Dashboard</h1>
            {userId && (
              <Button
                variant="secondary"
                size="default"
                onClick={copyUserId}
                data-testid="button-copy-user-id"
              >
                {userId}
                {copied ? (
                  <Check className="w-4 h-4 ml-2" />
                ) : (
                  <Copy className="w-4 h-4 ml-2" />
                )}
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Welcome back!'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <WalletButton />
          {!isActivated && (
            <Button data-testid="button-activate-account" onClick={() => setShowActivation(true)}>
              Activate Account ({activationFee ? formatDualCurrency(activationFee) : '...'})
            </Button>
          )}
        </div>
      </div>
      
      <Dialog open={showActivation} onOpenChange={setShowActivation}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Activate Your Account</DialogTitle>
                <DialogDescription>
                  Total Activation Fee: {activationFee ? formatDualCurrency(activationFee) : '...'} distributed across 8 payments
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="one-shot" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="one-shot">One-Shot On-Chain</TabsTrigger>
                  <TabsTrigger value="individual">Individual On-Chain</TabsTrigger>
                  <TabsTrigger value="offline">Offline</TabsTrigger>
                </TabsList>

                <TabsContent value="one-shot" className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Web3 Payment (USDT on-chain) - Pay the entire activation fee in a single transaction
                    </AlertDescription>
                  </Alert>
                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold">Payment Method:</span>
                      <span className="text-sm">Web3 (USDT on-chain)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Amount:</span>
                      <span className="font-semibold">
                        {activationFee ? formatDualCurrency(activationFee) : '...'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      This will approve and pay the full activation fee in one transaction. All 8 payments will be distributed automatically.
                    </p>
                  </div>
                  <PaymentModeSelector onSuccess={() => setShowActivation(false)} />
                </TabsContent>

                <TabsContent value="individual" className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Pay each of the 8 receivers individually on-chain. You'll need to approve and send 8 separate transactions.
                    </AlertDescription>
                  </Alert>
                  {activationData?.receivers && activationData.receivers.length > 0 ? (
                    <div className="space-y-3">
                      {activationData.receivers.map((receiver: string, index: number) => {
                        const isPaid = individualPaymentStatus[index] === 'paid';
                        const amount = activationData.amounts?.[index] || '0';
                        return (
                          <Card key={index}>
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold">ID: #{index + 1}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {receiver.slice(0, 10)}...{receiver.slice(-8)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-sm">{formatDualCurrency(amount)}</p>
                                  <Badge variant={isPaid ? 'default' : 'outline'} className="mt-1">
                                    {isPaid ? 'Paid' : 'Pending'}
                                  </Badge>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                className="w-full" 
                                variant={isPaid ? 'secondary' : 'default'}
                                disabled={isPaid}
                                onClick={() => handleIndividualPayment(index)}
                                data-testid={`button-pay-individual-${index}`}
                              >
                                {isPaid ? 'Paid' : `Pay ${formatDualCurrency(amount)}`}
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Array.from({ length: 8 }).map((_, index) => {
                        const amount = activationFee ? (parseFloat(activationFee) / 8).toFixed(2) : '0';
                        const isPaid = individualPaymentStatus[index] === 'paid';
                        return (
                          <Card key={index}>
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold">ID: #{index + 1}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Receiver will be assigned
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-sm">{formatDualCurrency(amount)}</p>
                                  <Badge variant="outline" className="mt-1">
                                    Pending
                                  </Badge>
                                </div>
                              </div>
                              <Button size="sm" className="w-full" variant="outline" disabled>
                                Pay {formatDualCurrency(amount)}
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="offline" className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Submit payment proof for offline payment. Admin will verify and activate your account.
                    </AlertDescription>
                  </Alert>
                  {creatorCards && creatorCards[0] && (
                    <div className="p-4 bg-muted rounded-md text-sm space-y-1">
                      <p className="font-semibold">Payment Details:</p>
                      <p>Name: {creatorCards[0].holderName}</p>
                      <p>Bank: {creatorCards[0].bankName}</p>
                      <p>Account: {creatorCards[0].accountNumber}</p>
                      {creatorCards[0].ifscOrSwift && <p>IFSC: {creatorCards[0].ifscOrSwift}</p>}
                      {creatorCards[0].upiId && <p>UPI: {creatorCards[0].upiId}</p>}
                    </div>
                  )}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Submit Payment Proofs:</p>
                    {Array.from({ length: 8 }).map((_, index) => {
                      const amount = activationFee ? (parseFloat(activationFee) / 8).toFixed(2) : '0';
                      const proof = paymentProofs[index];
                      const canResubmit = proof.status === 'resubmit';
                      const isPaid = proof.status === 'paid';
                      
                      return (
                        <Card key={index}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold">Payment #{index + 1}</p>
                                <p className="text-xs text-muted-foreground">{formatDualCurrency(amount)}</p>
                              </div>
                              <Badge 
                                variant={
                                  isPaid ? 'default' : 
                                  canResubmit ? 'destructive' : 
                                  'outline'
                                }
                              >
                                {isPaid ? 'Paid' : canResubmit ? 'Resubmit' : 'Pending'}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Input 
                                placeholder="Transaction ID / UTR" 
                                value={proof.transactionId}
                                onChange={(e) => handlePaymentProofChange(index, 'transactionId', e.target.value)}
                                disabled={isPaid}
                                data-testid={`input-transaction-id-${index}`}
                              />
                              <Input 
                                placeholder="Payment proof URL" 
                                value={proof.proofUrl}
                                onChange={(e) => handlePaymentProofChange(index, 'proofUrl', e.target.value)}
                                disabled={isPaid}
                                data-testid={`input-proof-url-${index}`}
                              />
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full" 
                              variant={isPaid ? 'secondary' : 'default'}
                              onClick={() => handleSubmitProof(index)}
                              disabled={isPaid}
                              data-testid={`button-submit-proof-${index}`}
                            >
                              {isPaid ? 'Submitted' : canResubmit ? 'Resubmit Proof' : 'Submit Proof'}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
      </Dialog>

      {!isActivated && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Your account is not activated yet. Please activate to start earning.
          </AlertDescription>
        </Alert>
      )}

      {(activationLoading || binaryLoading) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Income"
              value={formatINR(totalIncome)}
              subtitle="All income sources combined"
              icon={DollarSign}
              iconColor="text-primary"
            />
            <StatCard
              title="Sponsoring Income"
              value={formatINR(sponsoringIncome)}
              subtitle="Direct referral earnings"
              icon={Users}
              iconColor="text-chart-1"
            />
            <StatCard
              title="Binary Income"
              value={formatINR(binaryIncome)}
              subtitle={`${pairsMatched} pairs matched`}
              icon={GitBranch}
              iconColor="text-chart-2"
            />
            <StatCard
              title="Matrix Income"
              value={formatINR(matrixIncome)}
              subtitle="5-level matrix earnings"
              icon={Layers}
              iconColor="text-chart-3"
            />
            <StatCard
              title="Re-entry Income"
              value={formatINR(reentryIncome)}
              subtitle="Matrix re-entry cycles"
              icon={RefreshCw}
              iconColor="text-chart-4"
            />
            <StatCard
              title="Additional Re-entry"
              value={formatINR(additionalReentryIncome)}
              subtitle="Extra positions"
              icon={Plus}
              iconColor="text-chart-5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Left Team"
              value={directLeft.toString()}
              subtitle="Direct members"
              icon={ArrowLeftRight}
              iconColor="text-chart-5"
            />
            <StatCard
              title="Right Team"
              value={directRight.toString()}
              subtitle="Direct members"
              icon={ArrowLeftRight}
              iconColor="text-chart-5"
            />
            <StatCard
              title="Team Balance"
              value={`${binaryData?.leftUnits || 0} : ${binaryData?.rightUnits || 0}`}
              subtitle="Total left : right units"
              icon={RefreshCw}
              iconColor="text-chart-4"
            />
          </div>
        </>
      )}

      {/* Affiliate Links Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Affiliate Links
          </CardTitle>
          <CardDescription>Share your referral links to build your team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Link */}
            <div className="space-y-2">
              <Label htmlFor="left-link">Left Team Link</Label>
              <div className="flex gap-2">
                <Input
                  id="left-link"
                  value={account ? `${window.location.origin}/?ref=${account}&side=left` : ''}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="input-left-link"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyAffiliateLink('left')}
                  data-testid="button-copy-left-link"
                >
                  {copiedLink === 'left' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link to add members to your left team
              </p>
            </div>

            {/* Right Link */}
            <div className="space-y-2">
              <Label htmlFor="right-link">Right Team Link</Label>
              <div className="flex gap-2">
                <Input
                  id="right-link"
                  value={account ? `${window.location.origin}/?ref=${account}&side=right` : ''}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="input-right-link"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyAffiliateLink('right')}
                  data-testid="button-copy-right-link"
                >
                  {copiedLink === 'right' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link to add members to your right team
              </p>
            </div>
          </div>

          <Alert>
            <Link2 className="w-4 h-4" />
            <AlertDescription>
              Build a balanced team by sharing both links. Your binary income depends on matching pairs from left and right teams.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <Alert>
          <AlertDescription>
            Transaction history will be populated from blockchain events. Connect your wallet and activate your account to start tracking transactions.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
