import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PendingPayment {
  id: string;
  fromUser: string;
  toReceiver: string;
  slotIndex: number;
  amount: string;
  proofUrl: string;
  date: string;
}

export default function AdminPayments() {
  const { toast } = useToast();
  // todo: remove mock functionality
  const [payments, setPayments] = useState<PendingPayment[]>([
    {
      id: '1',
      fromUser: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
      toReceiver: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      slotIndex: 0,
      amount: '50 USDT',
      proofUrl: 'https://example.com/proof1.jpg',
      date: '2025-11-07',
    },
    {
      id: '2',
      fromUser: '0xAbCdEf1234567890aBcDeF1234567890AbCdEf12',
      toReceiver: '0x1234567890123456789012345678901234567890',
      slotIndex: 1,
      amount: '10 USDT',
      proofUrl: 'https://example.com/proof2.jpg',
      date: '2025-11-06',
    },
    {
      id: '3',
      fromUser: '0x9876543210987654321098765432109876543210',
      toReceiver: '0x5555666677778888999900001111222233334444',
      slotIndex: 2,
      amount: '5 USDT',
      proofUrl: 'https://example.com/proof3.jpg',
      date: '2025-11-06',
    },
  ]);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleApprove = (id: string) => {
    console.log('Approved payment:', id);
    setPayments(payments.filter(p => p.id !== id));
    toast({
      title: 'Payment Approved',
      description: 'The offline payment has been confirmed.',
    });
  };

  const handleReject = (id: string) => {
    console.log('Rejected payment:', id);
    setPayments(payments.filter(p => p.id !== id));
    toast({
      title: 'Payment Rejected',
      description: 'The offline payment proof has been rejected.',
      variant: 'destructive',
    });
  };

  const slotNames = [
    'Sponsor',
    'Binary',
    'Creator',
    'Matrix L1',
    'Matrix L2',
    'Matrix L3',
    'Matrix L4',
    'Matrix L5',
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Confirmations</h1>
          <p className="text-muted-foreground">Review and approve offline payment proofs</p>
        </div>
        <Badge variant="destructive" className="text-lg px-4 py-2">
          {payments.length} Pending
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Offline Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No pending payment confirmations
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From User</TableHead>
                  <TableHead>To Receiver</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {truncate(payment.fromUser)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {truncate(payment.toReceiver)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{slotNames[payment.slotIndex]}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{payment.amount}</TableCell>
                    <TableCell>
                      <a
                        href={payment.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-sm">{payment.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(payment.id)}
                          data-testid={`button-approve-${payment.id}`}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(payment.id)}
                          data-testid={`button-reject-${payment.id}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
