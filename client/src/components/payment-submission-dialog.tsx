import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface PaymentSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    slotIndex: number;
    paymentType: string;
    receiverUserId: string | null;
    receiverType: 'user' | 'admin';
    amountInr: string;
    status: string;
    rejectionReason?: string | null;
  };
  onSuccess: () => void;
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
        const uploadResponse = await apiRequest<{ uploadUrl: string; publicUrl: string }>('/api/objects/upload', 'POST', {
          filename: proofFile.name,
          contentType: proofFile.type,
        });

        // Upload file to presigned URL
        await fetch(uploadResponse.uploadUrl, {
          method: 'PUT',
          body: proofFile,
          headers: {
            'Content-Type': proofFile.type,
          },
        });

        proofUrl = uploadResponse.publicUrl;
      }

      // Submit payment proof
      await apiRequest(`/api/activation-payments/${payment.id}/submit`, 'PATCH', {
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
      <DialogContent className="sm:max-w-md">
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
              <strong>Receiver:</strong> {payment.receiverType === 'admin' ? 'Admin Wallet' : payment.receiverUserId}
            </p>
          </div>

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
