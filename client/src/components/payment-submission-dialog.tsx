import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertCircle, Copy, CheckCircle, Smartphone, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface PaymentSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    slotIndex: number;
    paymentType: string;
    payerUserId: string;
    receiverUserId: string | null;
    receiverType: 'user' | 'admin';
    amountInr: string;
    status: string;
    rejectionReason?: string | null;
  };
  onSuccess: () => void;
}

interface ReceiverDetails {
  userId: string;
  name: string | null;
  mobile: string | null;
  upiId: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber?: string | null; // New field
  bankAccount?: string | null; // Legacy field - keep for backward compatibility
  ifscCode: string | null;
  paymentQrUrl: string | null;
}

export function PaymentSubmissionDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: PaymentSubmissionDialogProps) {
  const { toast } = useToast();
  const [utrId, setUtrId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch receiver details (user or admin)
  // For admin payments, include payment type to get correct fallback details
  const queryKey = payment.receiverType === 'admin'
    ? [`/api/admin/payment-details?paymentType=${payment.paymentType}`]
    : ['/api/users/payment-details', payment.receiverUserId];

  const { data: receiverDetails } = useQuery<ReceiverDetails>({
    queryKey,
    enabled: open && (payment.receiverType === 'admin' || !!payment.receiverUserId),
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: 'Copied',
      description: `${fieldName} copied to clipboard`,
    });
  };

  const handleSubmit = async () => {
    if (!utrId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter UTR/Transaction ID',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Submit payment with UTR ID only
      await apiRequest('PATCH', `/api/activation-payments/${payment.id}/submit`, {
        offlineUtrId: utrId,
      });

      toast({
        title: 'Success',
        description: 'Payment submitted successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/activation-payments'] });
      onSuccess();
      onOpenChange(false);
      setUtrId('');
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit payment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isRejected = payment.status === 'rejected';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isRejected ? 'Resubmit Payment Proof' : 'Submit Payment Proof'}
          </DialogTitle>
          <DialogDescription>
            Payment for {payment.paymentType.replace(/_/g, ' ')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isRejected && payment.rejectionReason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Previous submission rejected:</strong> {payment.rejectionReason}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm">
              <strong>Amount:</strong> ₹{payment.amountInr}
            </p>
            <p className="text-sm">
              <strong>Receiver:</strong> {receiverDetails?.userId || (payment.receiverType === 'admin' ? 'Admin (PB0)' : payment.receiverUserId)}
            </p>
          </div>

          {/* Receiver Payment Details with UPI/Bank Tabs */}
          {receiverDetails && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm mb-4">Choose Payment Method</h3>
                
                <Tabs defaultValue="upi" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upi" className="gap-2" data-testid="tab-upi-payment">
                      <Smartphone className="h-4 w-4" />
                      UPI Payment
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="gap-2" data-testid="tab-bank-payment">
                      <Building2 className="h-4 w-4" />
                      Bank Transfer
                    </TabsTrigger>
                  </TabsList>

                  {/* UPI Payment Tab */}
                  <TabsContent value="upi" className="space-y-4 mt-4">
                    {receiverDetails.upiId ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column: UPI Details */}
                        <div className="space-y-3">
                          {receiverDetails.name && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Account Holder Name</Label>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{receiverDetails.name}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(receiverDetails.name!, 'Name')}
                                  data-testid="button-copy-name-upi"
                                >
                                  {copiedField === 'Name' ? (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {receiverDetails.mobile && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Mobile Number</Label>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-mono">{receiverDetails.mobile}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(receiverDetails.mobile!, 'Mobile')}
                                  data-testid="button-copy-mobile-upi"
                                >
                                  {copiedField === 'Mobile' ? (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">UPI ID</Label>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-mono break-all">{receiverDetails.upiId}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(receiverDetails.upiId!, 'UPI ID')}
                                data-testid="button-copy-upi-id"
                              >
                                {copiedField === 'UPI ID' ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: QR Code */}
                        {receiverDetails.paymentQrUrl && (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Label className="text-xs text-muted-foreground">Scan to Pay</Label>
                            <div className="border rounded-lg p-2 bg-white dark:bg-white">
                              <img 
                                src={receiverDetails.paymentQrUrl} 
                                alt="UPI Payment QR Code" 
                                className="w-40 h-40"
                                data-testid="img-upi-qr-code"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">Scan with any UPI app</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          UPI payment details not available for this receiver. Please use bank transfer.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  {/* Bank Transfer Tab */}
                  <TabsContent value="bank" className="space-y-4 mt-4">
                    {(() => {
                      // Use either bankAccountNumber (new) or bankAccount (legacy) for backward compatibility
                      const accountNumber = receiverDetails.bankAccountNumber || receiverDetails.bankAccount;
                      const hasBankDetails = receiverDetails.ifscCode && accountNumber;
                      
                      return hasBankDetails ? (
                        <div className="space-y-3">
                          {receiverDetails.bankAccountHolder && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Account Holder Name</Label>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{receiverDetails.bankAccountHolder}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(receiverDetails.bankAccountHolder!, 'Account Holder')}
                                  data-testid="button-copy-bank-holder"
                                >
                                  {copiedField === 'Account Holder' ? (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Bank Account Number</Label>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-mono">{accountNumber}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(accountNumber!, 'Account Number')}
                                data-testid="button-copy-bank-account"
                              >
                                {copiedField === 'Account Number' ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">IFSC Code</Label>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-mono">{receiverDetails.ifscCode}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(receiverDetails.ifscCode!, 'IFSC Code')}
                                data-testid="button-copy-ifsc"
                              >
                                {copiedField === 'IFSC Code' ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {receiverDetails.mobile && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Mobile Number</Label>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-mono">{receiverDetails.mobile}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(receiverDetails.mobile!, 'Mobile')}
                                  data-testid="button-copy-mobile-bank"
                                >
                                  {copiedField === 'Mobile' ? (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Bank account details not available for this receiver. Please use UPI payment.
                          </AlertDescription>
                        </Alert>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="utr">UTR / Transaction ID *</Label>
            <Input
              id="utr"
              placeholder="Enter transaction ID"
              value={utrId}
              onChange={(e) => setUtrId(e.target.value)}
              data-testid="input-utr"
            />
            <p className="text-xs text-muted-foreground">
              Enter the UTR or transaction ID from your payment app
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !utrId.trim()}
            data-testid="button-submit-payment"
          >
            {submitting ? 'Submitting...' : 'Submit Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
