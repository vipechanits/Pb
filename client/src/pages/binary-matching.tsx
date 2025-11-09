import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useWeb3 } from '@/context/Web3Context';
import { useBinaryReport, useBinaryMatchingCriteria } from '@/hooks/useBlockchainData';
import WalletButton from '@/components/WalletButton';

const USDT_TO_INR = 100;

export default function BinaryMatching() {
  const { account, isConnected } = useWeb3();
  const { data: binaryData, isLoading } = useBinaryReport();
  const { data: criteria } = useBinaryMatchingCriteria();

  if (!isConnected) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Binary Matching</h1>
            <p className="text-muted-foreground">View your binary tree and matching statistics</p>
          </div>
          <WalletButton />
        </div>
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please connect your wallet to view your binary matching data
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const directLeft = binaryData?.directLeft || 0;
  const directRight = binaryData?.directRight || 0;
  const leftUnits = binaryData?.leftUnits || 0;
  const rightUnits = binaryData?.rightUnits || 0;
  const pairsMatched = binaryData?.pairsMatched || 0;
  const accruedUSDT = parseFloat(binaryData?.accruedUSDT || '0');
  const qualified = binaryData?.qualified || false;

  const matchLeft = criteria?.matchLeft || 3;
  const matchRight = criteria?.matchRight || 3;

  const carryForwardLeft = leftUnits % matchLeft;
  const carryForwardRight = rightUnits % matchRight;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Binary Matching</h1>
        <p className="text-muted-foreground">View your binary tree and matching statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Left Team Direct</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-left-team">{directLeft}</div>
                <p className="text-xs text-muted-foreground">{leftUnits} total units</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Right Team Direct</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-right-team">{directRight}</div>
                <p className="text-xs text-muted-foreground">{rightUnits} total units</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pairs Matched</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-pairs-matched">{pairsMatched}</div>
                <p className="text-xs text-muted-foreground">Total pairs ({matchLeft}:{matchRight})</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-earned">
                  {accruedUSDT.toFixed(2)} USDT
                </div>
                <p className="text-xs text-muted-foreground">₹{(accruedUSDT * USDT_TO_INR).toFixed(2)} INR</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Binary Qualification Status</CardTitle>
          <CardDescription>
            Binary matching requires at least 1 direct on each side to start earning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-md">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <Skeleton className="h-5 w-5 rounded-full" />
              ) : qualified ? (
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
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <Badge variant={qualified ? 'default' : 'destructive'} data-testid="badge-qualification">
                {qualified ? 'Qualified' : 'Not Qualified'}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Carry Forward (Left)</div>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-carry-left">{carryForwardLeft}</div>
              )}
            </div>
            <div className="p-4 border rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Carry Forward (Right)</div>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-carry-right">{carryForwardRight}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Binary Tree Visualization</CardTitle>
          <CardDescription>
            Interactive tree view will be available once the event indexer backend is implemented
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-2">Tree visualization coming soon</p>
            <p className="text-sm">
              The current blockchain integration provides real-time statistics. 
              Full binary tree visualization with all downline members requires an event indexer service which will be added in a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
