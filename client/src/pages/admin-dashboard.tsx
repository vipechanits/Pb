import { Shield, RefreshCw, GitBranch } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivationFee, useBinaryMatchingCriteria } from '@/hooks/useBlockchainData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { data: activationFee, isLoading: feeLoading } = useActivationFee();
  const { data: criteria, isLoading: criteriaLoading } = useBinaryMatchingCriteria();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">View current system settings and blockchain data</p>
      </div>

      <Alert>
        <AlertDescription>
          System statistics require blockchain event log parsing. Admin write functions (updateActivationFee, updateBinaryPayout, updateMatchingCriteria) are contract methods that require admin wallet signatures and can be called directly via the contract interface when needed.
        </AlertDescription>
      </Alert>

      {(feeLoading || criteriaLoading) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Activation Fee"
            value={`${activationFee || '...'} USDT`}
            subtitle="Current activation fee"
            icon={Shield}
            iconColor="text-primary"
          />
          <StatCard
            title="Match Left Criteria"
            value={criteria?.matchLeft?.toString() || '...'}
            subtitle="Required left members"
            icon={GitBranch}
            iconColor="text-chart-1"
          />
          <StatCard
            title="Match Right Criteria"
            value={criteria?.matchRight?.toString() || '...'}
            subtitle="Required right members"
            icon={RefreshCw}
            iconColor="text-chart-2"
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network:</span>
            <span className="font-semibold">Polygon Amoy Testnet</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contract Address:</span>
            <span className="font-mono text-sm">0xE1eD8da387AcDF4BaB818f8Fc12cFc03314cDf7E</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Activation Fee:</span>
            <span className="font-semibold">{activationFee || '...'} USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Binary Criteria:</span>
            <span className="font-semibold">
              {criteria?.matchLeft || '...'} left, {criteria?.matchRight || '...'} right
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
