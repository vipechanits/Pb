import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  type: string;
  from?: string;
  to?: string;
  amount: string;
  amountInr: string;
  date: string;
  status: 'confirmed' | 'pending' | 'rejected';
  mode: 'web3' | 'offline';
}

interface IncomeTableProps {
  transactions: Transaction[];
}

export default function IncomeTable({ transactions }: IncomeTableProps) {
  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
    }
  };

  const truncateAddress = (addr?: string) => {
    if (!addr) return '-';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="rounded-md border" data-testid="table-income">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>From/To</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No transactions yet
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                <TableCell className="font-medium">{tx.type}</TableCell>
                <TableCell className="font-mono text-sm">
                  {truncateAddress(tx.from || tx.to)}
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{tx.amount}</div>
                  <div className="text-xs text-muted-foreground">{tx.amountInr}</div>
                </TableCell>
                <TableCell className="text-sm">{tx.date}</TableCell>
                <TableCell>
                  <Badge variant="outline">{tx.mode}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
