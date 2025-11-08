import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BinaryTreeView from '@/components/BinaryTreeView';
import { CheckCircle, XCircle } from 'lucide-react';

export default function BinaryMatching() {
  // todo: remove mock functionality
  const mockStats = {
    leftCount: 12,
    rightCount: 15,
    qualified: true,
    pairsMatched: 12,
    usdtEarned: 120,
    carryForward: { left: 0, right: 3 },
  };

  const mockTree = {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
    active: true,
    left: {
      address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      active: true,
      left: {
        address: '0x1234567890123456789012345678901234567890',
        active: true,
      },
      right: {
        address: '0xAbCdEf1234567890aBcDeF1234567890AbCdEf12',
        active: false,
      },
    },
    right: {
      address: '0x9876543210987654321098765432109876543210',
      active: true,
      left: {
        address: '0x5555666677778888999900001111222233334444',
        active: true,
      },
    },
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Binary Matching</h1>
        <p className="text-muted-foreground">View your binary tree and matching statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Left Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.leftCount}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Right Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.rightCount}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pairs Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.pairsMatched}</div>
            <p className="text-xs text-muted-foreground">Total pairs (3:3)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.usdtEarned} USDT</div>
            <p className="text-xs text-muted-foreground">₹{mockStats.usdtEarned * 100} INR</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Binary Qualification Status</CardTitle>
          <CardDescription>Check if you meet the binary qualification criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-md">
            <div className="flex items-center gap-3">
              {mockStats.qualified ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <div className="font-semibold">Qualification Status</div>
                <div className="text-sm text-muted-foreground">
                  Required: 1 left, 1 right minimum
                </div>
              </div>
            </div>
            <Badge variant={mockStats.qualified ? 'default' : 'destructive'}>
              {mockStats.qualified ? 'Qualified' : 'Not Qualified'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Carry Forward (Left)</div>
              <div className="text-2xl font-bold">{mockStats.carryForward.left}</div>
            </div>
            <div className="p-4 border rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Carry Forward (Right)</div>
              <div className="text-2xl font-bold">{mockStats.carryForward.right}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <BinaryTreeView root={mockTree} />
    </div>
  );
}
