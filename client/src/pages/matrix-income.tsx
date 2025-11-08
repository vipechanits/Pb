import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MatrixGrid from '@/components/MatrixGrid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

export default function MatrixIncome() {
  // todo: remove mock functionality
  const mockPositions = [
    { index: 1, address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7', level: 1, isCurrentUser: true, filled: true },
    { index: 2, address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', level: 2, filled: true },
    { index: 3, address: '0xAbCdEf1234567890aBcDeF1234567890AbCdEf12', level: 2, filled: true },
    { index: 4, address: '0x1234567890123456789012345678901234567890', level: 3, filled: true },
    { index: 5, address: '0x9876543210987654321098765432109876543210', level: 3, filled: false },
  ];

  const mockLevelPayouts = [
    { level: 1, amount: '5 USDT', recipient: '0x8626...1199', recipientName: 'User A', status: 'paid' },
    { level: 2, amount: '5 USDT', recipient: '0xAbCd...dEf12', recipientName: 'User B', status: 'paid' },
    { level: 3, amount: '5 USDT', recipient: '0x1234...7890', recipientName: 'User C', status: 'pending' },
    { level: 4, amount: '5 USDT', recipient: 'N/A', recipientName: 'Not filled', status: 'pending' },
    { level: 5, amount: '5 USDT', recipient: 'N/A', recipientName: 'Not filled', status: 'pending' },
  ];

  const matrixFull = false; // todo: remove mock functionality

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Matrix Income</h1>
          <p className="text-muted-foreground">Track your 5-level matrix position and earnings</p>
        </div>
        {matrixFull && (
          <Button data-testid="button-reentry">
            <RefreshCw className="w-4 h-4 mr-2" />
            Buy Re-Entry
          </Button>
        )}
      </div>

      {matrixFull && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Matrix Complete!</CardTitle>
            <CardDescription>
              Your 5-level matrix is full. Purchase a re-entry to continue earning.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MatrixGrid positions={mockPositions} maxLevel={5} />

        <Card>
          <CardHeader>
            <CardTitle>5-Level Payout Statistics</CardTitle>
            <CardDescription>Track your earnings from each matrix level</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLevelPayouts.map((payout) => (
                  <TableRow key={payout.level}>
                    <TableCell className="font-medium">Level {payout.level}</TableCell>
                    <TableCell>{payout.amount}</TableCell>
                    <TableCell>
                      <div>{payout.recipientName}</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {payout.recipient}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={payout.status === 'paid' ? 'default' : 'secondary'}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matrix Position Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Your Index</div>
            <div className="text-2xl font-bold font-mono">1</div>
          </div>
          <div className="p-4 border rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Parent Index</div>
            <div className="text-2xl font-bold font-mono">0</div>
          </div>
          <div className="p-4 border rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Matrix Level</div>
            <div className="text-2xl font-bold">1</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
