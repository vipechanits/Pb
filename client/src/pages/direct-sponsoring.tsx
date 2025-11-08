import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import IncomeTable from '@/components/IncomeTable';

export default function DirectSponsoring() {
  // todo: remove mock functionality
  const mockTransactions = [
    {
      id: '1',
      type: 'Sponsoring Income',
      from: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      amount: '10 USDT',
      amountInr: '₹1,000',
      date: '2025-11-07',
      status: 'confirmed' as const,
      mode: 'web3' as const,
    },
    {
      id: '2',
      type: 'Sponsoring Income',
      from: '0xAbCdEf1234567890aBcDeF1234567890AbCdEf12',
      amount: '10 USDT',
      amountInr: '₹1,000',
      date: '2025-11-06',
      status: 'confirmed' as const,
      mode: 'offline' as const,
    },
    {
      id: '3',
      type: 'Sponsoring Income',
      from: '0x1234567890123456789012345678901234567890',
      amount: '10 USDT',
      amountInr: '₹1,000',
      date: '2025-11-05',
      status: 'pending' as const,
      mode: 'web3' as const,
    },
    {
      id: '4',
      type: 'Sponsoring Income',
      from: '0x9876543210987654321098765432109876543210',
      amount: '10 USDT',
      amountInr: '₹1,000',
      date: '2025-11-04',
      status: 'confirmed' as const,
      mode: 'offline' as const,
    },
  ];

  const totalSponsors = mockTransactions.length;
  const totalIncome = mockTransactions.filter(t => t.status === 'confirmed').length * 10;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Direct Sponsoring</h1>
        <p className="text-muted-foreground">Track your direct sponsoring income and team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sponsors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSponsors}</div>
            <p className="text-xs text-muted-foreground">Direct referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalIncome} USDT</div>
            <p className="text-xs text-muted-foreground">₹{totalIncome * 100} INR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg per Sponsor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">10 USDT</div>
            <p className="text-xs text-muted-foreground">₹1,000 INR</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Sponsoring History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeTable transactions={mockTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
