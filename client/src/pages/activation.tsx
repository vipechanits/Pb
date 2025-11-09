import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Circle, AlertCircle, Loader2, Wallet, FileText, Upload } from 'lucide-react';
import { formatUnits } from 'ethers';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ObjectUploader } from '@/components/ObjectUploader';

interface ActivationData {
  hasActivation: boolean;
  activated: boolean;
  receivers: string[];
  amounts: string[];
  paid: boolean[];
  verifiedOnchain: boolean[];
  modes: string[];
  proofs: string[];
}

const PAYMENT_LABELS = [
  'Direct Sponsor',
  'Binary Match',
  'Creator Fee',
  'Matrix Level 1',
  'Matrix Level 2',
  'Matrix Level 3',
  'Matrix Level 4',
  'Matrix Level 5',
];

const PAYMENT_TYPES = [
  'direct_sponsor',
  'binary_match',
  'creator_fee',
  'matrix_level_1',
  'matrix_level_2',
  'matrix_level_3',
  'matrix_level_4',
  'matrix_level_5',
] as const;

export default function ActivationPage() {
  const { account, isConnected, isCorrectNetwork } = useWeb3();
  const { getUserActivationData, getActivationFee, approveUSDT, paySlotWeb3, submitOfflineProof } = useContract();
  const { toast } = useToast();
  
  const [activationData, setActivationData] = useState<ActivationData | null>(null);
  const [activationFee, setActivationFee] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<'web3' | 'offline'>('web3');
  const [offlineUtr, setOfflineUtr] = useState('');
  const [offlineProofUrl, setOfflineProofUrl] = useState('');
  const [offlineNotes, setOfflineNotes] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showProofUploader, setShowProofUploader] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      loadActivationData();
      loadActivationFee();
    }
  }, [isConnected, account]);

  const loadActivationData = async () => {
    try {
      const data = await getUserActivationData();
      console.log('🔍 Activation Data from Contract:', data);
      if (data && data.receivers) {
        console.log('📋 Receivers Array:', data.receivers);
        data.receivers.forEach((receiver: string, idx: number) => {
          console.log(`Receiver[${idx}]:`, receiver, 'isZero:', receiver.toLowerCase() === '0x0000000000000000000000000000000000000000');
        });
      }
      setActivationData(data);
    } catch (error) {
      console.error('Error loading activation data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activation data',
        variant: 'destructive',
      });
    }
  };

  const loadActivationFee = async () => {
    try {
      const fee = await getActivationFee();
      if (fee) {
        setActivationFee(fee);
      }
    } catch (error) {
      console.error('Error loading activation fee:', error);
    }
  };

  const handlePaymentClick = (slotIndex: number) => {
    setSelectedSlot(slotIndex);
    setPaymentMode('web3');
    setOfflineUtr('');
    setOfflineProofUrl('');
    setOfflineNotes('');
    setShowPaymentDialog(true);
  };

  const handleApproveAndPay = async () => {
    if (selectedSlot === null || !activationData) return;

    setIsLoading(true);
    try {
      const amount = activationData.amounts[selectedSlot];
      
      const approvalReceipt = await approveUSDT(amount);
      if (!approvalReceipt) {
        setIsLoading(false);
        return;
      }

      const paymentReceipt = await paySlotWeb3(selectedSlot);
      if (paymentReceipt) {
        toast({
          title: 'Payment Successful',
          description: `Payment ${selectedSlot + 1} completed successfully`,
        });
        await loadActivationData();
        setShowPaymentDialog(false);
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfflinePayment = async () => {
    if (selectedSlot === null || !offlineUtr.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide UTR/Transaction ID',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const receipt = await submitOfflineProof(selectedSlot, offlineUtr, offlineProofUrl || 'pending');
      if (receipt) {
        toast({
          title: 'Proof Submitted',
          description: 'Your payment proof has been submitted for verification',
        });
        await loadActivationData();
        setShowPaymentDialog(false);
      }
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit proof',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProofUpload = (url: string) => {
    setOfflineProofUrl(url);
    setShowProofUploader(false);
    toast({
      title: 'Proof Uploaded',
      description: 'Payment proof uploaded successfully',
    });
  };

  const getPaymentStatus = (slotIndex: number) => {
    if (!activationData) return { icon: Circle, text: 'Pending', variant: 'secondary' as const };
    
    if (activationData.paid[slotIndex] && activationData.verifiedOnchain[slotIndex]) {
      return { icon: CheckCircle2, text: 'Completed', variant: 'default' as const };
    }
    
    if (activationData.modes[slotIndex] === 'offline' && activationData.proofs[slotIndex]) {
      return { icon: AlertCircle, text: 'Pending Verification', variant: 'secondary' as const };
    }
    
    return { icon: Circle, text: 'Pending', variant: 'outline' as const };
  };

  const getReceiverInfo = (slotIndex: number) => {
    if (!activationData || !activationData.receivers[slotIndex]) {
      return { address: 'Loading...', isAdmin: false };
    }

    const receiver = activationData.receivers[slotIndex];
    
    // Multiple checks for zero address to handle different formats
    const receiverLower = receiver.toLowerCase();
    const isZeroAddress = 
      receiverLower === '0x0000000000000000000000000000000000000000' ||
      receiverLower === '0x' + '0'.repeat(40) ||
      receiver === '0x0000000000000000000000000000000000000000' ||
      /^0x0+$/.test(receiverLower); // Regex to match 0x followed by any number of zeros
    
    // Debug logging
    console.log(`🔍 Slot ${slotIndex}:`, {
      receiver,
      receiverLower,
      isZeroAddress,
      check1: receiverLower === '0x0000000000000000000000000000000000000000',
      check2: receiverLower === '0x' + '0'.repeat(40),
      check3: /^0x0+$/.test(receiverLower)
    });
    
    return {
      address: isZeroAddress ? 'Admin Wallet' : `${receiver.slice(0, 6)}...${receiver.slice(-4)}`,
      isAdmin: isZeroAddress,
    };
  };

  const totalPayments = activationData?.amounts.length || 0;
  const completedPayments = activationData?.paid.filter((p, i) => p && activationData.verifiedOnchain[i]).length || 0;
  const pendingPayments = totalPayments - completedPayments;

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to view activation details</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Wrong Network</CardTitle>
            <CardDescription>Please switch to Polygon Amoy Testnet to continue</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activation</h1>
          <p className="text-muted-foreground">Complete your account activation by making 8 payments</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Activation Fee</div>
          <div className="text-2xl font-bold">${activationFee} USDT</div>
          <div className="text-sm text-muted-foreground">₹{(parseFloat(activationFee) * 100).toFixed(2)} INR</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-payments">{totalPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-completed-payments">{completedPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-pending-payments">{pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Checklist</CardTitle>
          <CardDescription>Complete all 8 payments to activate your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activationData && activationData.receivers.length > 0 ? (
            activationData.receivers.map((_, index) => {
              const status = getPaymentStatus(index);
              const receiver = getReceiverInfo(index);
              const amount = activationData.amounts[index];
              const StatusIcon = status.icon;
              const isPaid = activationData.paid[index] && activationData.verifiedOnchain[index];

              return (
                <div key={index} data-testid={`payment-slot-${index}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg border hover-elevate">
                    <div className="flex items-center gap-4 flex-1">
                      <StatusIcon 
                        className={`w-5 h-5 ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} 
                      />
                      <div className="flex-1">
                        <div className="font-medium">{PAYMENT_LABELS[index]}</div>
                        <div className="text-sm text-muted-foreground">
                          To: {receiver.address}
                          {receiver.isAdmin && (
                            <Badge variant="secondary" className="ml-2" data-testid={`badge-admin-${index}`}>Admin Wallet</Badge>
                          )}
                        </div>
                        {activationData.modes[index] && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Mode: {activationData.modes[index]}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${amount} USDT</div>
                        <div className="text-sm text-muted-foreground">
                          ₹{(parseFloat(amount) * 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <Badge variant={status.variant} data-testid={`status-${index}`}>
                        {status.text}
                      </Badge>
                      {!isPaid && (
                        <Button
                          size="sm"
                          onClick={() => handlePaymentClick(index)}
                          disabled={isLoading}
                          data-testid={`button-pay-${index}`}
                        >
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                  {index < activationData.receivers.length - 1 && <Separator className="my-4" />}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading activation data...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Payment {selectedSlot !== null ? selectedSlot + 1 : ''} - {selectedSlot !== null ? PAYMENT_LABELS[selectedSlot] : ''}
            </DialogTitle>
            <DialogDescription>
              Choose your payment method and complete the payment
            </DialogDescription>
          </DialogHeader>

          {selectedSlot !== null && activationData && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Receiver</div>
                <div className="font-medium flex items-center gap-2">
                  {getReceiverInfo(selectedSlot).address}
                  {getReceiverInfo(selectedSlot).isAdmin && (
                    <Badge variant="secondary" data-testid="badge-admin-dialog">Admin Wallet</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-2">Amount</div>
                <div className="text-2xl font-bold">
                  ${activationData.amounts[selectedSlot]} USDT
                </div>
                <div className="text-sm text-muted-foreground">
                  ₹{(parseFloat(activationData.amounts[selectedSlot]) * 100).toFixed(2)} INR
                </div>
              </div>

              <div className="space-y-3">
                <Label>Payment Mode</Label>
                <RadioGroup value={paymentMode} onValueChange={(value) => setPaymentMode(value as 'web3' | 'offline')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="web3" id="web3" data-testid="radio-web3" />
                    <Label htmlFor="web3" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="w-4 h-4" />
                      Web3 Payment (On-chain)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="offline" id="offline" data-testid="radio-offline" />
                    <Label htmlFor="offline" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="w-4 h-4" />
                      Offline Payment (With Proof)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentMode === 'offline' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="utr">UTR / Transaction ID *</Label>
                    <Input
                      id="utr"
                      value={offlineUtr}
                      onChange={(e) => setOfflineUtr(e.target.value)}
                      placeholder="Enter transaction reference"
                      data-testid="input-utr"
                    />
                  </div>

                  <div>
                    <Label htmlFor="proof">Payment Proof (Optional)</Label>
                    {offlineProofUrl ? (
                      <div className="flex items-center gap-2 p-2 border rounded-md" data-testid="proof-uploaded">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm flex-1 truncate" title={offlineProofUrl}>{offlineProofUrl}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setOfflineProofUrl('')}
                          data-testid="button-remove-proof"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowProofUploader(true)}
                        data-testid="button-upload-proof"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Proof
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={offlineNotes}
                      onChange={(e) => setOfflineNotes(e.target.value)}
                      placeholder="Any additional information"
                      rows={3}
                      data-testid="input-notes"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              disabled={isLoading}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              onClick={paymentMode === 'web3' ? handleApproveAndPay : handleOfflinePayment}
              disabled={isLoading || (paymentMode === 'offline' && !offlineUtr.trim())}
              data-testid="button-submit-payment"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {paymentMode === 'web3' ? 'Approve & Pay' : 'Submit Proof'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProofUploader} onOpenChange={setShowProofUploader}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Payment Proof</DialogTitle>
            <DialogDescription>
              Upload a screenshot or document of your payment transaction
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760}
              onGetUploadParameters={async () => {
                try {
                  const response = await fetch('/api/objects/upload', { method: 'POST' });
                  if (!response.ok) {
                    throw new Error('Failed to get upload URL');
                  }
                  const { uploadURL } = await response.json();
                  if (!uploadURL) {
                    throw new Error('No upload URL received');
                  }
                  return { method: 'PUT' as const, url: uploadURL };
                } catch (error) {
                  console.error('Error getting upload URL:', error);
                  toast({
                    title: 'Upload Error',
                    description: 'Failed to prepare file upload',
                    variant: 'destructive',
                  });
                  throw error;
                }
              }}
              onComplete={(result) => {
                if (!result.successful || result.successful.length === 0) {
                  toast({
                    title: 'Upload Failed',
                    description: 'No files were uploaded successfully',
                    variant: 'destructive',
                  });
                  return;
                }
                
                const uploadedFile = result.successful[0];
                if (!uploadedFile.uploadURL) {
                  toast({
                    title: 'Upload Error',
                    description: 'Invalid upload result',
                    variant: 'destructive',
                  });
                  return;
                }
                
                const url = uploadedFile.uploadURL.split('?')[0];
                handleProofUpload(url);
                toast({
                  title: 'Upload Successful',
                  description: `${uploadedFile.name || 'File'} uploaded successfully`,
                });
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </ObjectUploader>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
