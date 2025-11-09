import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, Users, Shield } from 'lucide-react';
import WalletButton from '@/components/WalletButton';
import NetworkBadge from '@/components/NetworkBadge';
import { useWeb3 } from '@/context/Web3Context';
import { useActivationData } from '@/hooks/useBlockchainData';
import logoUrl from '@assets/Generated Image October 16, 2025 - 6_58AM (1)_1762653844897.png';

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isConnected, isCorrectNetwork, account } = useWeb3();
  const { data: activationData } = useActivationData();

  useEffect(() => {
    if (isConnected && isCorrectNetwork && account) {
      if (activationData?.activated) {
        setLocation('/user');
      }
    }
  }, [isConnected, isCorrectNetwork, account, activationData, setLocation]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="PAYBACK247" className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-bold">PAYBACK247</h1>
              <p className="text-xs text-muted-foreground">HybridP2P Rooted Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NetworkBadge network="polygon-amoy" isCorrect={isCorrectNetwork} />
            <WalletButton />
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-center mb-6">
              <img src={logoUrl} alt="PAYBACK247" className="w-32 h-32" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Welcome to PAYBACK247
            </h2>
            <p className="text-xl text-muted-foreground">
              A hybrid peer-to-peer MLM system with USDT-based activations, binary pairing income,
              and 5-level matrix rewards on Polygon network.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              {!isConnected ? (
                <WalletButton />
              ) : !isCorrectNetwork ? (
                <NetworkBadge network="polygon-amoy" isCorrect={false} />
              ) : (
                <Button size="lg" onClick={() => setLocation('/user')} data-testid="button-get-started">
                  <Wallet className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              )}
              <Button size="lg" variant="outline" data-testid="button-learn-more">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Binary Pairing Income</CardTitle>
                <CardDescription>
                  Earn from binary matching with 3:3 FIFO criteria and carry forward system
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-chart-3/10 flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-chart-3" />
                </div>
                <CardTitle>5-Level Matrix</CardTitle>
                <CardDescription>
                  Benefit from a 2×N global matrix with automatic re-entry cycles
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-chart-2/10 flex items-center justify-center mb-2">
                  <Shield className="w-6 h-6 text-chart-2" />
                </div>
                <CardTitle>Secure Payments</CardTitle>
                <CardDescription>
                  Web3 and offline payment modes with on-chain verification on Polygon
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 text-center bg-muted/30">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl font-bold">Ready to join?</h3>
            <p className="text-muted-foreground">
              Connect your wallet to access your dashboard and start earning with PAYBACK247
            </p>
            {!isConnected && (
              <div className="pt-4">
                <WalletButton />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
