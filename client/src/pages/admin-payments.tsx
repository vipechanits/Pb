import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Eye, DollarSign, Users, Plus, Send } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useWeb3 } from '@/context/Web3Context';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ObjectUploader } from '@/components/ObjectUploader';
import type { UploadResult } from '@uppy/core';

interface FallbackPayment {
  id: string;
  paymentType: string;
  userWalletAddress: string;
  amountUsdt: string;
  amountInr: string;
  transactionId: string | null;
  paymentProofUrl: string | null;
  adminConfirmed: boolean;
  adminConfirmedAt: Date | null;
  adminWalletAddress: string | null;
  userConfirmed: boolean;
  userConfirmedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const USDT_TO_INR = 100;

const formatDualCurrency = (usdtAmount: string | number): string => {
  const usdt = typeof usdtAmount === 'string' ? parseFloat(usdtAmount) : usdtAmount;
  const inr = (usdt * USDT_TO_INR).toFixed(2);
  return `${usdt} USDT / ₹${inr}`;
};

export default function AdminPayments() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<FallbackPayment | null>(null);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    paymentType: 'binary',
    userWalletAddress: '',
    amountUsdt: '',
    transactionId: '',
    notes: '',
    paymentProofUrl: '',
  });

  const { data: allPayments, isLoading: allLoading } = useQuery<FallbackPayment[]>({
    queryKey: ['/api/fallback-payments'],
    refetchInterval: 30000,
  });

  const { data: pendingPayments, isLoading: pendingLoading } = useQuery<FallbackPayment[]>({
    queryKey: ['/api/fallback-payments/pending'],
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const amountInr = (parseFloat(data.amountUsdt) * USDT_TO_INR).toString();
      return await apiRequest('POST', '/api/fallback-payments', {
        ...data,
        amountInr,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fallback-payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fallback-payments/pending'] });
      setShowCreateDialog(false);
      setFormData({
        paymentType: 'binary',
        userWalletAddress: '',
        amountUsdt: '',
        transactionId: '',
        notes: '',
        paymentProofUrl: '',
      });
      toast({
        title: "Payment Created",
        description: "Fallback payment has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create fallback payment",
        variant: "destructive",
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return await apiRequest('POST', '/api/fallback-payments/' + paymentId + '/confirm-admin', { adminWalletAddress: account });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fallback-payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fallback-payments/pending'] });
      toast({
        title: "Payment Confirmed",
        description: "You have confirmed sending this payment",
      });
    },
    onError: () => {
      toast({
        title: "Confirmation Failed",
        description: "Failed to confirm payment",
        variant: "destructive",
      });
    },
  });

  const handleConfirm = async (paymentId: string) => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your admin wallet",
        variant: "destructive",
      });
      return;
    }
    await confirmMutation.mutateAsync(paymentId);
  };

  const handleCreate = async () => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your admin wallet",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.userWalletAddress || !formData.amountUsdt) {
      toast({
        title: "Missing Information",
        description: "Please fill in user wallet address and amount",
        variant: "destructive",
      });
      return;
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.userWalletAddress)) {
      toast({
        title: "Invalid Wallet Address",
        description: "Please enter a valid Ethereum wallet address",
        variant: "destructive",
      });
      return;
    }

    // Validate amount is a valid positive number
    const amount = parseFloat(formData.amountUsdt);
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    await createMutation.mutateAsync(formData);
  };

  const handleProofUpload = async (result: UploadResult) => {
    try {
      if (result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const response = await fetch('/api/payment-proofs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadedPath: uploadedFile.uploadURL }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({ ...prev, paymentProofUrl: data.objectPath }));
          toast({
            title: "Proof Uploaded",
            description: "Payment proof has been uploaded successfully",
          });
        } else {
          throw new Error('Failed to process uploaded file');
        }
      } else if (result.failed.length > 0) {
        throw new Error(result.failed[0].error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload payment proof. Please try again.",
        variant: "destructive",
      });
    }
  };

  const viewProof = (payment: FallbackPayment) => {
    setSelectedPayment(payment);
    setShowProofDialog(true);
  };

  const renderPaymentCard = (payment: FallbackPayment) => (
    <Card key={payment.id}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={payment.paymentType === 'binary' ? 'default' : 'secondary'}>
                {payment.paymentType.toUpperCase()}
              </Badge>
              <Badge variant={payment.adminConfirmed ? 'default' : payment.userConfirmed ? 'secondary' : 'outline'}>
                {payment.adminConfirmed && payment.userConfirmed
                  ? 'Completed'
                  : payment.adminConfirmed
                  ? 'Sent - Awaiting User'
                  : payment.userConfirmed
                  ? 'User Confirmed'
                  : 'Not Sent'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-semibold">User: {payment.userWalletAddress.slice(0, 10)}...{payment.userWalletAddress.slice(-8)}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold">{formatDualCurrency(payment.amountUsdt)}</p>
            {payment.transactionId && (
              <p className="text-xs text-muted-foreground font-mono mt-1">
                TX: {payment.transactionId.slice(0, 8)}...
              </p>
            )}
          </div>
        </div>

        {payment.notes && (
          <Alert>
            <AlertDescription className="text-xs">{payment.notes}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {payment.paymentProofUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewProof(payment)}
              data-testid={`button-view-proof-${payment.id}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Proof
            </Button>
          )}
          {!payment.adminConfirmed && (
            <Button
              size="sm"
              onClick={() => handleConfirm(payment.id)}
              disabled={confirmMutation.isPending}
              data-testid={`button-confirm-${payment.id}`}
            >
              <Send className="w-4 h-4 mr-2" />
              Confirm Sent
            </Button>
          )}
        </div>

        {payment.adminConfirmed && payment.adminConfirmedAt && (
          <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
            <p>Payment sent: {format(new Date(payment.adminConfirmedAt), 'MMM dd, yyyy HH:mm')}</p>
            {payment.adminWalletAddress && (
              <p className="font-mono">Sent by: {payment.adminWalletAddress.slice(0, 10)}...{payment.adminWalletAddress.slice(-8)}</p>
            )}
          </div>
        )}
        {payment.userConfirmed && payment.userConfirmedAt && (
          <div className="text-xs text-muted-foreground">
            <p>User confirmed receipt: {format(new Date(payment.userConfirmedAt), 'MMM dd, yyyy HH:mm')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const pendingCount = pendingPayments?.length || 0;
  const totalBinaryAmount = allPayments?.filter(p => p.paymentType === 'binary').reduce((sum, p) => sum + parseFloat(p.amountUsdt), 0) || 0;
  const totalMatrixAmount = allPayments?.filter(p => p.paymentType === 'matrix').reduce((sum, p) => sum + parseFloat(p.amountUsdt), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fallback Payment Management</h1>
          <p className="text-muted-foreground">Create and confirm binary/matrix fallback payments</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-payment">
              <Plus className="w-4 h-4 mr-2" />
              Create Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Fallback Payment</DialogTitle>
              <DialogDescription>
                Record a binary or matrix fallback payment that couldn't be distributed on-chain
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select
                  value={formData.paymentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentType: value }))}
                >
                  <SelectTrigger id="paymentType" data-testid="select-payment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binary">Binary Income</SelectItem>
                    <SelectItem value="matrix">Matrix Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userWalletAddress">User Wallet Address</Label>
                <Input
                  id="userWalletAddress"
                  placeholder="0x..."
                  value={formData.userWalletAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, userWalletAddress: e.target.value }))}
                  data-testid="input-user-wallet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountUsdt">Amount (USDT)</Label>
                <Input
                  id="amountUsdt"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amountUsdt}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountUsdt: e.target.value }))}
                  data-testid="input-amount"
                />
                {formData.amountUsdt && (
                  <p className="text-sm text-muted-foreground">
                    ₹{(parseFloat(formData.amountUsdt) * USDT_TO_INR).toFixed(2)} INR
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID / UTR (Optional)</Label>
                <Input
                  id="transactionId"
                  placeholder="Transaction reference"
                  value={formData.transactionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                  data-testid="input-transaction-id"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Proof (Optional)</Label>
                <ObjectUploader
                  onComplete={handleProofUpload}
                  allowedFileTypes={['image/*', '.pdf']}
                  maxFileSize={10 * 1024 * 1024}
                  maxNumberOfFiles={1}
                />
                {formData.paymentProofUrl && (
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      Payment proof uploaded successfully
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this payment"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  data-testid="button-submit-payment"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Payment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Not yet sent to users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Binary Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBinaryAmount.toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">₹{(totalBinaryAmount * USDT_TO_INR).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Matrix Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatrixAmount.toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">₹{(totalMatrixAmount * USDT_TO_INR).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="binary">Binary Payments</TabsTrigger>
          <TabsTrigger value="matrix">Matrix Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : pendingPayments && pendingPayments.length > 0 ? (
            <div className="space-y-3">
              {pendingPayments.map(payment => renderPaymentCard(payment))}
            </div>
          ) : (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                No pending fallback payments. Create a payment above to record binary or matrix income that couldn't be distributed on-chain.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="binary" className="space-y-4">
          {allLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : allPayments && allPayments.filter(p => p.paymentType === 'binary').length > 0 ? (
            <div className="space-y-3">
              {allPayments.filter(p => p.paymentType === 'binary').map(payment => renderPaymentCard(payment))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                No binary fallback payments found
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          {allLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : allPayments && allPayments.filter(p => p.paymentType === 'matrix').length > 0 ? (
            <div className="space-y-3">
              {allPayments.filter(p => p.paymentType === 'matrix').map(payment => renderPaymentCard(payment))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                No matrix fallback payments found
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              {selectedPayment && `${selectedPayment.paymentType.toUpperCase()} Payment - ${formatDualCurrency(selectedPayment.amountUsdt)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && selectedPayment.paymentProofUrl && (
            <div className="space-y-4">
              <div className="relative w-full max-h-96 bg-muted rounded-md overflow-hidden">
                <img
                  src={selectedPayment.paymentProofUrl}
                  alt="Payment proof"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              {selectedPayment.transactionId && (
                <div className="space-y-2">
                  <Label>Transaction ID / UTR</Label>
                  <Input value={selectedPayment.transactionId} readOnly className="font-mono text-sm" />
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => window.open(selectedPayment.paymentProofUrl!, '_blank')}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
