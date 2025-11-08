import { useState } from 'react';
import { DollarSign, Users, GitBranch, Grid3x3, RefreshCw, ArrowLeftRight } from 'lucide-react';
import StatCard from '@/components/StatCard';
import PaymentModeSelector from '@/components/PaymentModeSelector';
import IncomeTable from '@/components/IncomeTable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function UserDashboard() {
  const [showActivation, setShowActivation] = useState(false);

  // todo: remove mock functionality
  const mockTransactions = [
    {
      id: '1',
      type: 'Direct Sponsoring',
      from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
      amount: '10 USDT',
      amountInr: '₹1,000',
      date: '2025-11-07',
      status: 'confirmed' as const,
      mode: 'web3' as const,
    },
    {
      id: '2',
      type: 'Binary Matching',
      to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      amount: '30 USDT',
      amountInr: '₹3,000',
      date: '2025-11-06',
      status: 'confirmed' as const,
      mode: 'offline' as const,
    },
    {
      id: '3',
      type: 'Matrix Level 1',
      to: '0xAbCdEf1234567890aBcDeF1234567890AbCdEf12',
      amount: '5 USDT',
      amountInr: '₹500',
      date: '2025-11-05',
      status: 'pending' as const,
      mode: 'web3' as const,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your income overview</p>
        </div>
        <Dialog open={showActivation} onOpenChange={setShowActivation}>
          <DialogTrigger asChild>
            <Button data-testid="button-activate-account">Activate Account</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Activate Your Account</DialogTitle>
              <DialogDescription>
                Choose your preferred payment method to activate your account
              </DialogDescription>
            </DialogHeader>
            <PaymentModeSelector
              onWeb3Payment={() => {
                console.log('Account activated via Web3');
                setShowActivation(false);
              }}
              onOfflineSubmit={() => {
                console.log('Offline proof submitted');
                setShowActivation(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value="125.5 USDT"
          subtitle="₹12,550 INR"
          icon={DollarSign}
          iconColor="text-primary"
          trend={{ value: '12.5%', positive: true }}
        />
        <StatCard
          title="Direct Sponsoring"
          value="45 USDT"
          subtitle="₹4,500 INR"
          icon={Users}
          iconColor="text-chart-1"
        />
        <StatCard
          title="Binary Matching"
          value="60 USDT"
          subtitle="₹6,000 INR"
          icon={GitBranch}
          iconColor="text-chart-3"
        />
        <StatCard
          title="Matrix Income"
          value="20.5 USDT"
          subtitle="₹2,050 INR"
          icon={Grid3x3}
          iconColor="text-chart-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Re-entry Count"
          value="3"
          subtitle="Total cycles completed"
          icon={RefreshCw}
          iconColor="text-chart-4"
        />
        <StatCard
          title="Left Team"
          value="12"
          subtitle="Active members"
          icon={ArrowLeftRight}
          iconColor="text-chart-5"
        />
        <StatCard
          title="Right Team"
          value="15"
          subtitle="Active members"
          icon={ArrowLeftRight}
          iconColor="text-chart-5"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <IncomeTable transactions={mockTransactions} />
      </div>
    </div>
  );
}
