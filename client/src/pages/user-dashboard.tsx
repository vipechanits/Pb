import { useState } from 'react';
import { DollarSign, Users, GitBranch, Grid3x3, RefreshCw, ArrowLeftRight } from 'lucide-react';
import StatCard from '@/components/StatCard';
import PaymentModeSelector from '@/components/PaymentModeSelector';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useWeb3 } from '@/context/Web3Context';
import { useActivationData, useBinaryReport, useActivationFee } from '@/hooks/useBlockchainData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function UserDashboard() {
  const [showActivation, setShowActivation] = useState(false);
  const { account, isConnected } = useWeb3();
  const { data: activationData, isLoading: activationLoading } = useActivationData();
  const { data: binaryData, isLoading: binaryLoading } = useBinaryReport();
  const { data: activationFee } = useActivationFee();


  if (!isConnected) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please connect your wallet to view your dashboard
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isActivated = activationData?.activated || false;
  const totalIncome = binaryData?.accruedUSDT || '0';
  const directLeft = binaryData?.directLeft || 0;
  const directRight = binaryData?.directRight || 0;
  const pairsMatched = binaryData?.pairsMatched || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Dashboard</h1>
          <p className="text-muted-foreground">
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Welcome back!'}
          </p>
        </div>
        {!isActivated && (
          <Dialog open={showActivation} onOpenChange={setShowActivation}>
            <DialogTrigger asChild>
              <Button data-testid="button-activate-account">
                Activate Account ({activationFee || '...'} USDT)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Activate Your Account</DialogTitle>
                <DialogDescription>
                  Activation Fee: {activationFee || '...'} USDT. Choose your preferred payment method.
                </DialogDescription>
              </DialogHeader>
              <PaymentModeSelector
                onSuccess={() => {
                  setShowActivation(false);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isActivated && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Your account is not activated yet. Please activate to start earning.
          </AlertDescription>
        </Alert>
      )}

      {(activationLoading || binaryLoading) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Binary Income"
              value={`${totalIncome} USDT`}
              subtitle={`${pairsMatched} pairs matched`}
              icon={DollarSign}
              iconColor="text-primary"
            />
            <StatCard
              title="Direct Sponsoring"
              value="Coming Soon"
              subtitle="Requires event log parsing"
              icon={Users}
              iconColor="text-chart-1"
            />
            <StatCard
              title="Pairs Matched"
              value={pairsMatched.toString()}
              subtitle="Binary matches"
              icon={GitBranch}
              iconColor="text-chart-3"
            />
            <StatCard
              title="Qualification"
              value={binaryData?.qualified ? 'Yes' : 'No'}
              subtitle={`${directLeft} left, ${directRight} right`}
              icon={Grid3x3}
              iconColor="text-chart-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Left Team"
              value={directLeft.toString()}
              subtitle="Direct members"
              icon={ArrowLeftRight}
              iconColor="text-chart-5"
            />
            <StatCard
              title="Right Team"
              value={directRight.toString()}
              subtitle="Direct members"
              icon={ArrowLeftRight}
              iconColor="text-chart-5"
            />
            <StatCard
              title="Team Balance"
              value={`${binaryData?.leftUnits || 0} : ${binaryData?.rightUnits || 0}`}
              subtitle="Total left : right units"
              icon={RefreshCw}
              iconColor="text-chart-4"
            />
          </div>
        </>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <Alert>
          <AlertDescription>
            Transaction history will be populated from blockchain events. Connect your wallet and activate your account to start tracking transactions.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
