import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ActivationPayment } from '@shared/schema';

export default function UserConfirmationPage() {
  const { toast } = useToast();
  const { playSuccessSound, playAlertSound } = useNotificationSound();
  const [selectedPayment, setSelectedPayment] = useState<ActivationPayment | null>(null);
  const [action, setAction] = useState<'confirm' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data: payments, isLoading, refetch } = useQuery<ActivationPayment[]>({
    queryKey: ['/api/activation-payments/pending-confirmations'],
  });

  const handleOpenDialog = (payment: ActivationPayment, actionType: 'confirm' | 'reject') => {
    setSelectedPayment(payment);
    setAction(actionType);
    setRejectionReason('');
    setConfirmNotes('');
  };

  const handleConfirm = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      console.log('[CONFIRM] Starting confirmation for payment:', selectedPayment.id);
      const response = await apiRequest('PATCH', `/api/activation-payments/${selectedPayment.id}/confirm`, {
        notes: confirmNotes || undefined,
      });
      console.log('[CONFIRM] Confirmation response received:', response.status);
      
      const data = await response.json();
      console.log('[CONFIRM] Confirmation successful:', data);

      // Play success sound for payment confirmation
      playSuccessSound();
      
      toast({
        title: 'Success',
        description: 'Payment confirmed successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/activation-payments'] });
      refetch();
      setSelectedPayment(null);
      setAction(null);
    } catch (error) {
      console.error('[CONFIRM] Error confirming payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      console.log('[CONFIRM] Finally block - resetting processing state');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      console.log('[REJECT] Starting rejection for payment:', selectedPayment.id);
      const response = await apiRequest('PATCH', `/api/activation-payments/${selectedPayment.id}/reject`, {
        rejectionReason,
      });
      console.log('[REJECT] Rejection response received:', response.status);
      
      const data = await response.json();
      console.log('[REJECT] Rejection successful:', data);

      // Play alert sound for payment rejection
      playAlertSound();
      
      toast({
        title: 'Payment Rejected',
        description: 'The sender can resubmit with correct details',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/activation-payments'] });
      refetch();
      setSelectedPayment(null);
      setAction(null);
    } catch (error) {
      console.error('[REJECT] Error rejecting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentTypeLabel = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
        <h1 className="text-3xl font-bold">Payment Confirmations</h1>
        <p className="text-muted-foreground">
          Review and confirm payments you've received
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting your review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
          <CardDescription>
            Confirm or reject payment proofs submitted to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments && payments.length > 0 ? (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{getPaymentTypeLabel(payment.paymentType)}</h3>
                        <Badge variant="secondary">Pending Review</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        From: <span className="font-mono font-semibold">{payment.payerUserId}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Amount:</strong> ₹{payment.amountInr}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(payment.updatedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Attempt #{payment.submissionCount}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 bg-muted/50 p-3 rounded-md">
                    <p className="text-sm">
                      <strong>UTR/Transaction ID:</strong> {payment.offlineUtrId || 'Not provided'}
                    </p>
                    {payment.offlineProofUrl && (
                      <a
                        href={payment.offlineProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View Payment Proof <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(payment, 'reject')}
                      data-testid={`button-reject-${payment.id}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenDialog(payment, 'confirm')}
                      data-testid={`button-confirm-${payment.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirm Payment
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No pending confirmations</p>
                <p className="text-sm text-muted-foreground">
                  All received payments have been confirmed
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={action === 'confirm'} onOpenChange={() => { setAction(null); setSelectedPayment(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Verify that you've received ₹{selectedPayment?.amountInr} from {selectedPayment?.payerUserId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-notes">Notes (Optional)</Label>
              <Textarea
                id="confirm-notes"
                placeholder="Add any notes about this confirmation..."
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAction(null); setSelectedPayment(null); }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={processing}
              data-testid="button-submit-confirm"
            >
              {processing ? 'Confirming...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={action === 'reject'} onOpenChange={() => { setAction(null); setSelectedPayment(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              The sender will be able to resubmit unlimited times
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please explain why you're rejecting this payment..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                data-testid="textarea-rejection-reason"
              />
              <p className="text-xs text-muted-foreground">
                Be specific so the sender can correct the issue
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAction(null); setSelectedPayment(null); }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              data-testid="button-submit-reject"
            >
              {processing ? 'Rejecting...' : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
