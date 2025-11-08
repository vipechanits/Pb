import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wallet, Upload, Loader2 } from 'lucide-react';
import { useContract } from '@/hooks/useContract';
import { useActivationFee, useCreatorCards } from '@/hooks/useBlockchainData';
import { queryClient } from '@/lib/queryClient';

interface PaymentModeSelectorProps {
  onSuccess?: () => void;
}

export default function PaymentModeSelector({
  onSuccess,
}: PaymentModeSelectorProps) {
  const [mode, setMode] = useState<'web3' | 'offline'>('web3');
  const [proof, setProof] = useState('');
  const [utrId, setUtrId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { approveUSDT, paySlotWeb3, submitOfflineProof, isLoading } = useContract();
  const { data: activationFee } = useActivationFee();
  const { data: creatorCards } = useCreatorCards();

  const handleWeb3Payment = async () => {
    if (!activationFee || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const approved = await approveUSDT(activationFee);
      if (!approved) {
        setIsProcessing(false);
        return;
      }
      
      const result = await paySlotWeb3(0);
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['activation'] });
        queryClient.invalidateQueries({ queryKey: ['binary-report'] });
        onSuccess?.();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOfflineSubmit = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = await submitOfflineProof(0, utrId, proof);
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['activation'] });
        onSuccess?.();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const firstCreatorCard = creatorCards?.[0];

  return (
    <Card data-testid="card-payment-mode">
      <CardHeader>
        <CardTitle>Choose Payment Mode</CardTitle>
        <CardDescription>Activate your account with Web3 or offline payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'web3' | 'offline')}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="web3" id="web3" data-testid="radio-web3" />
            <Label htmlFor="web3" className="font-normal">
              Web3 Payment (USDT on-chain)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="offline" id="offline" data-testid="radio-offline" />
            <Label htmlFor="offline" className="font-normal">
              Offline Payment (Upload proof)
            </Label>
          </div>
        </RadioGroup>

        {mode === 'web3' ? (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-muted rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Activation Fee:</span>
                <span className="font-semibold">{activationFee || '...'} USDT</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This will approve and pay the activation fee in USDT. Please confirm both transactions in your wallet.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={handleWeb3Payment}
              disabled={isProcessing || isLoading || !activationFee}
              data-testid="button-pay-web3"
            >
              {(isProcessing || isLoading) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Pay with USDT
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {firstCreatorCard && (
              <div className="p-4 bg-muted rounded-md text-sm space-y-1">
                <p className="font-semibold">Payment Details:</p>
                <p>Name: {firstCreatorCard.holderName}</p>
                <p>Bank: {firstCreatorCard.bankName}</p>
                <p>Account: {firstCreatorCard.accountNumber}</p>
                {firstCreatorCard.ifscOrSwift && <p>IFSC: {firstCreatorCard.ifscOrSwift}</p>}
                {firstCreatorCard.upiId && <p>UPI: {firstCreatorCard.upiId}</p>}
              </div>
            )}
            <div>
              <Label htmlFor="utr">Transaction ID / UTR</Label>
              <Input
                id="utr"
                placeholder="Enter transaction reference"
                value={utrId}
                onChange={(e) => setUtrId(e.target.value)}
                data-testid="input-utr-id"
              />
            </div>
            <div>
              <Label htmlFor="proof">Payment Proof URL</Label>
              <Input
                id="proof"
                placeholder="https://example.com/payment-proof.jpg"
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                data-testid="input-proof-url"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleOfflineSubmit}
              disabled={!proof || !utrId || isProcessing || isLoading}
              data-testid="button-submit-proof"
            >
              {(isProcessing || isLoading) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Proof
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
