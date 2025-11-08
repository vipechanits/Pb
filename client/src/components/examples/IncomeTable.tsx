import IncomeTable from '../IncomeTable';

export default function IncomeTableExample() {
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
      status: 'pending' as const,
      mode: 'offline' as const,
    },
  ];

  return (
    <div className="p-4">
      <IncomeTable transactions={mockTransactions} />
    </div>
  );
}
