import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, DollarSign, TrendingUp, Calendar, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface IncomeTransaction {
  id: string;
  userId: string;
  incomeType: 'direct_sponsor' | 'binary_match' | 'matrix_level_1' | 'matrix_level_2' | 'matrix_level_3' | 'matrix_level_4' | 'matrix_level_5' | 'reentry';
  amountInr: string;
  status: 'pending' | 'confirmed' | 'failed' | 'reversed';
  sourceUserId: string | null;
  activationId: string | null;
  activationPaymentId: string | null;
  createdAt: string;
  confirmedAt: string | null;
  notes: string | null;
}

export default function TransactionHistoryPage() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch all income transactions
  const { data: transactions, isLoading, error } = useQuery<IncomeTransaction[]>({
    queryKey: ['/api/users', user?.userId, 'income-transactions'],
    enabled: !!user?.userId,
  });

  const getIncomeTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      direct_sponsor: 'Direct Sponsor',
      binary_match: 'Binary Match',
      matrix_level_1: 'Matrix Level 1',
      matrix_level_2: 'Matrix Level 2',
      matrix_level_3: 'Matrix Level 3',
      matrix_level_4: 'Matrix Level 4',
      matrix_level_5: 'Matrix Level 5',
      reentry: 'Re-entry',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      confirmed: { variant: 'default', label: 'Confirmed' },
      pending: { variant: 'secondary', label: 'Pending' },
      failed: { variant: 'destructive', label: 'Failed' },
      reversed: { variant: 'outline', label: 'Reversed' },
    };
    const config = variants[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const getIncomeTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      direct_sponsor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      binary_match: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      matrix_level_1: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      matrix_level_2: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      matrix_level_3: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      matrix_level_4: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      matrix_level_5: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      reentry: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    };
    const colorClass = colors[type] || 'bg-muted text-muted-foreground';
    return (
      <Badge variant="outline" className={colorClass} data-testid={`badge-type-${type}`}>
        {getIncomeTypeLabel(type)}
      </Badge>
    );
  };

  // Filter transactions
  const filteredTransactions = transactions?.filter(tx => {
    if (filterType !== 'all' && tx.incomeType !== filterType) return false;
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
    return true;
  }) || [];

  // Calculate totals
  const totalEarnings = filteredTransactions
    .filter(tx => tx.status === 'confirmed')
    .reduce((sum, tx) => sum + parseFloat(tx.amountInr || '0'), 0);

  const pendingEarnings = filteredTransactions
    .filter(tx => tx.status === 'pending')
    .reduce((sum, tx) => sum + parseFloat(tx.amountInr || '0'), 0);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load transaction history. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="heading-transaction-history">
          Transaction History
        </h1>
        <p className="text-muted-foreground">
          Complete record of all amounts credited to your account
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Confirmed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-confirmed">
              ₹{totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {filteredTransactions.filter(tx => tx.status === 'confirmed').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-pending">
              ₹{pendingEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {filteredTransactions.filter(tx => tx.status === 'pending').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-count">
              {filteredTransactions.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions?.length || 0} total records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transactions by type and status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Income Type</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]" data-testid="select-income-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="direct_sponsor">Direct Sponsor</SelectItem>
                <SelectItem value="binary_match">Binary Match</SelectItem>
                <SelectItem value="matrix_level_1">Matrix Level 1</SelectItem>
                <SelectItem value="matrix_level_2">Matrix Level 2</SelectItem>
                <SelectItem value="matrix_level_3">Matrix Level 3</SelectItem>
                <SelectItem value="matrix_level_4">Matrix Level 4</SelectItem>
                <SelectItem value="matrix_level_5">Matrix Level 5</SelectItem>
                <SelectItem value="reentry">Re-entry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]" data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="reversed">Reversed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found matching the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                  data-testid={`transaction-${tx.id}`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getIncomeTypeBadge(tx.incomeType)}
                      {getStatusBadge(tx.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {format(new Date(tx.createdAt), 'PPp')}
                      </span>
                    </div>
                    {tx.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{tx.notes}</p>
                    )}
                    {tx.confirmedAt && (
                      <p className="text-xs text-muted-foreground">
                        Confirmed: {format(new Date(tx.confirmedAt), 'PPp')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${tx.status === 'confirmed' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      ₹{parseFloat(tx.amountInr).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
