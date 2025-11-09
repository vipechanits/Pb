import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useWeb3 } from '@/context/Web3Context';
import { useMatrixPosition } from '@/hooks/useBlockchainData';
import WalletButton from '@/components/WalletButton';

export default function MatrixIncome() {
  const { account, isConnected } = useWeb3();
  const { data: matrixPosition, isLoading } = useMatrixPosition();

  if (!isConnected) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Matrix Income</h1>
            <p className="text-muted-foreground">Track your 5-level matrix position and earnings</p>
          </div>
          <WalletButton />
        </div>
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please connect your wallet to view your matrix data
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const userIndex = matrixPosition?.index || 0;
  const parentIndex = matrixPosition?.parentIndex || 0;
  const matrixLevel = matrixPosition?.level || 0;
  const leftChildIndex = matrixPosition?.leftChildIndex || 0;
  const rightChildIndex = matrixPosition?.rightChildIndex || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Matrix Income</h1>
          <p className="text-muted-foreground">Track your 5-level matrix position and earnings</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          <strong>Note:</strong> Matrix income is distributed across 5 levels when users activate under you in the matrix structure. 
          Each level receives a portion of the activation fee based on the smart contract's distribution rules.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Matrix Position Info</CardTitle>
          <CardDescription>Your current position in the global matrix</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Your Index</div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono" data-testid="text-matrix-index">{userIndex}</div>
            )}
          </div>
          <div className="p-4 border rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Parent Index</div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono" data-testid="text-parent-index">{parentIndex}</div>
            )}
          </div>
          <div className="p-4 border rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Matrix Level</div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-matrix-level">{matrixLevel}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Child Positions</CardTitle>
          <CardDescription>Matrix indices of your direct children</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Left Child Index</div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono" data-testid="text-left-child">{leftChildIndex}</div>
            )}
            {leftChildIndex === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground mt-1">No left child yet</p>
            )}
          </div>
          <div className="p-4 border rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Right Child Index</div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono" data-testid="text-right-child">{rightChildIndex}</div>
            )}
            {rightChildIndex === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground mt-1">No right child yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income History</CardTitle>
          <CardDescription>
            Historical payout data will be available once the event indexer backend is implemented
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-2">Matrix income history coming soon</p>
            <p className="text-sm">
              The current blockchain integration provides real-time position data. 
              Historical payout records require an event indexer service which will be added in a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
