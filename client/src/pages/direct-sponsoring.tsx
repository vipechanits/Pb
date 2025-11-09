import { DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeb3 } from '@/context/Web3Context';
import { useBinaryReport } from '@/hooks/useBlockchainData';
import WalletButton from '@/components/WalletButton';

const USDT_TO_INR = 100;

export default function DirectSponsoring() {
  const { account, isConnected } = useWeb3();
  const { data: binaryData, isLoading } = useBinaryReport();

  if (!isConnected) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Direct Sponsoring</h1>
            <p className="text-muted-foreground">Track your direct sponsoring income and team</p>
          </div>
          <WalletButton />
        </div>
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please connect your wallet to view your sponsoring data
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const directLeft = binaryData?.directLeft || 0;
  const directRight = binaryData?.directRight || 0;
  const totalSponsors = directLeft + directRight;

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
              Left Team Direct
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-left-direct">{directLeft}</div>
                <p className="text-xs text-muted-foreground">Direct left referrals</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Right Team Direct
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-right-direct">{directRight}</div>
                <p className="text-xs text-muted-foreground">Direct right referrals</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Direct
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-total-direct">{totalSponsors}</div>
                <p className="text-xs text-muted-foreground">Combined direct referrals</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          <strong>Note:</strong> Direct sponsoring income is earned through binary pairing rather than per-referral bonuses. 
          Your direct referrals contribute to your binary tree (left and right teams) which generate income through the 3:3 matching system. 
          View your total binary income in the Binary Matching page.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Historical transaction data will be available once the event indexer backend is implemented
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-2">Transaction history coming soon</p>
            <p className="text-sm">
              The current blockchain integration provides real-time stats. 
              Historical transaction logs require an event indexer service which will be added in a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
