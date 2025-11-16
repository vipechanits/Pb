import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ActivationPayment } from '@shared/schema';

export default function AdminPayments() {
  const { toast } = useToast();
  const { playSuccessSound, playAlertSound } = useNotificationSound();
  const [selectedPayment, setSelectedPayment] = useState<ActivationPayment | null>(null);
  const [action, setAction] = useState<'confirm' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receiverQrCode, setReceiverQrCode] = useState<string | null>(null);
  const [loadingQrCode, setLoadingQrCode] = useState(false);
  
  const { data: payments, isLoading, refetch } = useQuery<ActivationPayment[]>({
    queryKey: ['/api/activation-payments/pending-confirmations'],
  });

  const handleOpenDialog = (payment: ActivationPayment, actionType: 'confirm' | 'reject') => {
    console.log('[ADMIN-PAYMENTS] Opening dialog:', { paymentId: payment.id, actionType, paymentType: payment.paymentType });
    setSelectedPayment(payment);
    setAction(actionType);
    setRejectionReason('');
    setConfirmNotes('');
    setReceiverQrCode(null);
  };

  // Fetch receiver's QR code when dialog opens
  useEffect(() => {
    if (selectedPayment && action === 'confirm') {
      const fetchReceiverQrCode = async () => {
        setLoadingQrCode(true);
        try {
          // Determine receiver ID (use 'PB0' for admin payments)
          const receiverId = selectedPayment.receiverType === 'admin' ? 'PB0' : selectedPayment.receiverUserId;
          
          const response = await apiRequest('GET', `/api/users/payment-details/${receiverId}`);
          const data = await response.json();
          
          // Generate QR code if receiver has payment details
          if (data.upiId || data.paymentQrUrl) {
            if (data.paymentQrUrl) {
              setReceiverQrCode(data.paymentQrUrl);
            } else if (data.upiId) {
              // Generate QR code from UPI ID
              const qrResponse = await apiRequest('POST', '/api/profile/generate-qr', {
                upiId: data.upiId,
                name: data.name || 'Admin',
                mobile: data.mobile || '0000000000'
              });
              const qrData = await qrResponse.json();
              setReceiverQrCode(qrData.qrCode);
            }
          }
        } catch (error) {
          console.error('Error fetching receiver QR code:', error);
        } finally {
          setLoadingQrCode(false);
        }
      };
      
      fetchReceiverQrCode();
    }
  }, [selectedPayment, action]);

  const handleConfirm = async () => {
    console.log('[ADMIN-PAYMENTS] handleConfirm called, selectedPayment:', selectedPayment?.id);
    if (!selectedPayment) {
      console.log('[ADMIN-PAYMENTS] No selected payment, returning');
      return;
    }

    setProcessing(true);
    console.log('[ADMIN-PAYMENTS] Starting confirmation request for payment:', selectedPayment.id);
    try {
      const response = await apiRequest('PATCH', `/api/activation-payments/${selectedPayment.id}/confirm`, {
        notes: confirmNotes || undefined,
      });
      console.log('[ADMIN-PAYMENTS] Confirmation successful:', response);

      // Play success sound for admin approval
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
      console.error('[ADMIN-PAYMENTS] Error confirming payment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to confirm payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      console.log('[ADMIN-PAYMENTS] Confirmation process finished');
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
      await apiRequest('PATCH', `/api/activation-payments/${selectedPayment.id}/reject`, {
        rejectionReason,
      });

      // Play alert sound for admin rejection
      playAlertSound();
      
      toast({
        title: 'Success',
        description: 'Payment rejected',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/activation-payments'] });
      refetch();
      setSelectedPayment(null);
      setAction(null);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentTypeLabel = (paymentType: string): string => {
    return paymentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Payment Approval Queue</h1>
          <p className="text-muted-foreground">
            Review and approve user payment submissions
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="default"
          data-testid="button-refresh"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : payments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Completed reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Queue ({payments?.length || 0})</CardTitle>
          <CardDescription>
            Review offline payment proofs and transaction confirmations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-20 animate-spin" />
              <p className="font-medium">Loading payments...</p>
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No pending payments</p>
              <p className="text-sm">Payment submissions will appear here for admin review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge>{getPaymentTypeLabel(payment.paymentType)}</Badge>
                          <Badge variant="outline">₹{payment.amountInr}</Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><strong>From:</strong> {payment.payerUserId}</p>
                          <p><strong>To:</strong> {payment.receiverType === 'admin' ? 'Admin Wallet' : payment.receiverUserId}</p>
                          {payment.offlineUtrId && (
                            <p><strong>UTR/Transaction ID:</strong> <span className="font-mono">{payment.offlineUtrId}</span></p>
                          )}
                          {payment.offlineProofUrl && (
                            <p>
                              <strong>Proof:</strong>{' '}
                              <a 
                                href={payment.offlineProofUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                View Payment Proof <ExternalLink className="h-3 w-3" />
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-white"
                          onClick={() => handleOpenDialog(payment, 'confirm')}
                          data-testid={`button-confirm-${payment.id}`}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOpenDialog(payment, 'reject')}
                          data-testid={`button-reject-${payment.id}`}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Payment Approval Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. User Submits Payment</h4>
            <p className="text-muted-foreground">Users enter UTR/Transaction ID and upload payment proof</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Admin Reviews</h4>
            <p className="text-muted-foreground">Verify the transaction details match the submitted proof</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Approve or Reject</h4>
            <p className="text-muted-foreground">Approve valid payments or reject with reason for correction</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. User Notified</h4>
            <p className="text-muted-foreground">Users receive status update and can proceed with activation</p>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={action === 'confirm'} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Confirm that you have verified this payment is valid
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>From:</strong> {selectedPayment.payerUserId}</p>
                <p><strong>To:</strong> {selectedPayment.receiverType === 'admin' ? 'Admin Wallet (PB0)' : selectedPayment.receiverUserId}</p>
                <p><strong>Amount:</strong> ₹{selectedPayment.amountInr}</p>
                <p><strong>Type:</strong> {getPaymentTypeLabel(selectedPayment.paymentType)}</p>
              </div>

              {/* Receiver's QR Code */}
              {loadingQrCode ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Loading receiver QR code...</p>
                </div>
              ) : receiverQrCode ? (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <Label className="text-sm font-semibold mb-2 block">Receiver's Payment QR Code:</Label>
                  <div className="bg-white p-2 rounded inline-block">
                    <img 
                      src={receiverQrCode} 
                      alt="Receiver QR Code" 
                      className="w-48 h-48 mx-auto"
                      data-testid="img-receiver-qr"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Verify payment was made to this QR code
                  </p>
                </div>
              ) : null}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirm-notes">Notes (Optional)</Label>
            <Textarea
              id="confirm-notes"
              placeholder="Add any notes about this confirmation..."
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              data-testid="input-confirm-notes"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={processing} data-testid="button-confirm-submit">
              {processing ? 'Confirming...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={action === 'reject'} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-2 text-sm">
              <p><strong>From:</strong> {selectedPayment.payerUserId}</p>
              <p><strong>Amount:</strong> ₹{selectedPayment.amountInr}</p>
              <p><strong>Type:</strong> {getPaymentTypeLabel(selectedPayment.paymentType)}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this payment is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              data-testid="input-rejection-reason"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={processing}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={processing || !rejectionReason.trim()}
              data-testid="button-reject-submit"
            >
              {processing ? 'Rejecting...' : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
