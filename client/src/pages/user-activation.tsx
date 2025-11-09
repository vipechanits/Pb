import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Circle, Clock, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PaymentSubmissionDialog } from '@/components/payment-submission-dialog';
import type { ActivationPayment } from '@shared/schema';

export default function UserActivationPage() {
  const { user } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState<ActivationPayment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch user's activation payments
  const { data: payments, isLoading, refetch } = useQuery<ActivationPayment[]>({
    queryKey: ['/api/activation-payments/payer', user?.userId],
    enabled: !!user?.userId,
  });

  const getPaymentSlotLabel = (slotIndex: number): string => {
    const labels = [
      'Direct Sponsor',
      'Binary Match',
      'Creator Fee',
      'Matrix Level 1',
      'Matrix Level 2',
      'Matrix Level 3',
      'Matrix Level 4',
      'Matrix Level 5',
    ];
    return labels[slotIndex] || `Payment ${slotIndex + 1}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-600">Confirmed</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Paid</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'submitted':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const confirmedCount = payments?.filter(p => p.status === 'confirmed').length || 0;
  const submittedCount = payments?.filter(p => p.status === 'submitted').length || 0;
  const rejectedCount = payments?.filter(p => p.status === 'rejected').length || 0;
  const totalAmount = 5000; // ₹625 × 8 = ₹5000

  const handlePayClick = (payment: ActivationPayment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Account Activation</h1>
        <p className="text-muted-foreground">
          Complete 8 payments to activate your account and start earning
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Activation Fee: ₹{totalAmount.toLocaleString()}</strong>
          <br />
          Pay ₹625 to each of the 8 slots below. All payments are direct peer-to-peer transfers using Google Pay, Paytm, or PhonePe.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedCount}/8</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{submittedCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Needs resubmission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(confirmedCount * 625).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">of ₹{totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Checklist</CardTitle>
          <CardDescription>Complete all 8 payments to activate your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments && payments.length > 0 ? (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`payment-slot-${payment.slotIndex}`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium">{getPaymentSlotLabel(payment.slotIndex)}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.receiverType === 'admin' ? 'Admin Wallet' : payment.receiverUserId}
                      </p>
                      {payment.status === 'submitted' && payment.offlineUtrId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          UTR: {payment.offlineUtrId}
                        </p>
                      )}
                      {payment.status === 'rejected' && payment.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Reason: {payment.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold">₹{payment.amountInr}</p>
                      {getStatusBadge(payment.status)}
                      {payment.submissionCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Attempts: {payment.submissionCount}
                        </p>
                      )}
                    </div>
                    {(payment.status === 'pending' || payment.status === 'rejected') && (
                      <Button
                        size="sm"
                        onClick={() => handlePayClick(payment)}
                        data-testid={`button-pay-${payment.slotIndex}`}
                      >
                        {payment.status === 'rejected' ? 'Resubmit' : 'Pay Now'}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payment slots found. Contact admin.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. Click "Pay Now"</h4>
            <p className="text-muted-foreground">Select a payment slot to begin the payment process</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Make Payment</h4>
            <p className="text-muted-foreground">Transfer ₹625 to the receiver's UPI ID or bank account via Google Pay, Paytm, or PhonePe</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Submit Proof</h4>
            <p className="text-muted-foreground">Enter your UTR/Transaction ID and optionally upload payment screenshot</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Wait for Confirmation</h4>
            <p className="text-muted-foreground">The receiver will verify and confirm your payment. If rejected, you can resubmit unlimited times.</p>
          </div>
        </CardContent>
      </Card>

      {selectedPayment && (
        <PaymentSubmissionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          payment={selectedPayment}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
