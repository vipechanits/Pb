import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, AlertCircle, Copy, CheckCircle } from 'lucide-react';
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
  bankAccount?: string | null;
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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch receiver details (user or admin)
  const { data: receiverDetails } = useQuery<ReceiverDetails>({
    queryKey: payment.receiverType === 'admin' 
      ? ['/api/admin/payment-details']
      : ['/api/users/payment-details', payment.receiverUserId],
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

    setUploading(true);

    try {
      let proofUrl = '';

      // Upload proof file if provided
      if (proofFile) {
        const response = await apiRequest('POST', '/api/objects/upload', {
          filename: proofFile.name,
          contentType: proofFile.type,
        });
        const uploadResponse = (await response.json()) as { uploadUrl: string; publicUrl: string };

        // Upload file to presigned URL
        await fetch(uploadResponse.uploadUrl, {
          method: 'PUT',
          body: proofFile,
          headers: {
            'Content-Type': proofFile.type,
          },
        });

        // Set ACL policy to make file publicly accessible
        // SECURITY FIX: Backend now uses authenticated userId from session
        await apiRequest('PUT', '/api/payment-proofs', {
          proofUrl: uploadResponse.publicUrl,
        });

        proofUrl = uploadResponse.publicUrl;
      }

      // Submit payment proof
      await apiRequest('PATCH', `/api/activation-payments/${payment.id}/submit`, {
        offlineUtrId: utrId,
        offlineProofUrl: proofUrl || undefined,
      });

      toast({
        title: 'Success',
        description: 'Payment proof submitted successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/activation-payments'] });
      onSuccess();
      onOpenChange(false);
      setUtrId('');
      setProofFile(null);
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit payment proof',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
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

          {/* Receiver Payment Details */}
          {receiverDetails && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-sm">Receiver Payment Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Payment Details */}
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

                    {receiverDetails.upiId && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">UPI ID</Label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono break-all">{receiverDetails.upiId}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(receiverDetails.upiId!, 'UPI ID')}
                          >
                            {copiedField === 'UPI ID' ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {receiverDetails.ifscCode && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">IFSC Code</Label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono">{receiverDetails.ifscCode}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(receiverDetails.ifscCode!, 'IFSC Code')}
                          >
                            {copiedField === 'IFSC Code' ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {receiverDetails.bankAccountHolder && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Bank Account Holder</Label>
                        <p className="text-sm font-medium">{receiverDetails.bankAccountHolder}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: QR Code */}
                  {receiverDetails.paymentQrUrl && (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Label className="text-xs text-muted-foreground">Scan to Pay</Label>
                      <div className="border rounded-lg p-2 bg-white">
                        <img 
                          src={receiverDetails.paymentQrUrl} 
                          alt="Payment QR Code" 
                          className="w-40 h-40"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Scan with any UPI app</p>
                    </div>
                  )}
                </div>
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

          <div className="space-y-2">
            <Label htmlFor="proof">Payment Screenshot (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="proof"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                data-testid="input-proof-file"
              />
              {proofFile && (
                <Upload className="h-4 w-4 text-green-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload payment screenshot or PDF (max 10MB)
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading || !utrId.trim()}
            data-testid="button-submit-payment"
          >
            {uploading ? 'Submitting...' : 'Submit Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
