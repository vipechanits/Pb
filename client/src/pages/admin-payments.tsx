import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Eye, DollarSign, Users } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useWeb3 } from '@/context/Web3Context';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

  const { data: allPayments, isLoading: allLoading } = useQuery<FallbackPayment[]>({
    queryKey: ['/api/fallback-payments'],
    refetchInterval: 30000,
  });

  const { data: pendingPayments, isLoading: pendingLoading } = useQuery<FallbackPayment[]>({
    queryKey: ['/api/fallback-payments/pending'],
    refetchInterval: 30000,
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
        description: "Fallback payment has been confirmed successfully",
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
                  ? 'Fully Confirmed'
                  : payment.adminConfirmed
                  ? 'Admin Confirmed'
                  : payment.userConfirmed
                  ? 'User Confirmed'
                  : 'Pending'}
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
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Receipt
            </Button>
          )}
        </div>

        {payment.adminConfirmed && payment.adminConfirmedAt && (
          <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
            <p>Admin confirmed: {format(new Date(payment.adminConfirmedAt), 'MMM dd, yyyy HH:mm')}</p>
            {payment.adminWalletAddress && (
              <p className="font-mono">By: {payment.adminWalletAddress.slice(0, 10)}...{payment.adminWalletAddress.slice(-8)}</p>
            )}
          </div>
        )}
        {payment.userConfirmed && payment.userConfirmedAt && (
          <div className="text-xs text-muted-foreground">
            <p>User confirmed: {format(new Date(payment.userConfirmedAt), 'MMM dd, yyyy HH:mm')}</p>
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
      <div>
        <h1 className="text-3xl font-bold">Fallback Payment Management</h1>
        <p className="text-muted-foreground">Review and confirm binary/matrix fallback payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin confirmation</p>
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
                No pending fallback payments to confirm
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
