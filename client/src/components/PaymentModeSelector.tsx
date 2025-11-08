import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wallet, Upload, Loader2 } from 'lucide-react';

interface PaymentModeSelectorProps {
  onWeb3Payment?: () => void;
  onOfflineSubmit?: (proof: string) => void;
}

export default function PaymentModeSelector({
  onWeb3Payment,
  onOfflineSubmit,
}: PaymentModeSelectorProps) {
  const [mode, setMode] = useState<'web3' | 'offline'>('web3');
  const [proof, setProof] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWeb3Payment = async () => {
    setLoading(true);
    console.log('Web3 payment triggered');
    await new Promise(resolve => setTimeout(resolve, 1500));
    onWeb3Payment?.();
    setLoading(false);
  };

  const handleOfflineSubmit = () => {
    console.log('Offline proof submitted:', proof);
    onOfflineSubmit?.(proof);
  };

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
                <span className="font-semibold">50 USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount in INR:</span>
                <span className="font-semibold">₹5,000</span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleWeb3Payment}
              disabled={loading}
              data-testid="button-pay-web3"
            >
              {loading ? (
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
              disabled={!proof}
              data-testid="button-submit-proof"
            >
              <Upload className="w-4 h-4 mr-2" />
              Submit Proof
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
