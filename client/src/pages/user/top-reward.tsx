import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, DollarSign, Calendar, User, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useSystemConfig } from '@/hooks/use-system-config';

interface TopRewardIncome {
  id: string;
  incomeType: string;
  amountInr: string;
  status: string;
  sourceUserId: string | null;
  sourceName: string | null;
  confirmedAt: string | null;
  createdAt: string;
  notes: string | null;
}

interface IncomeSummary {
  totalEarnings: string;
  topRewardIncome: string;
}

export default function TopRewardPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { config: systemConfig } = useSystemConfig();

  // Fetch income summary
  const { data: incomeSummary, isLoading: summaryLoading } = useQuery<IncomeSummary>({
    queryKey: ['/api/users', user?.userId, 'income-summary'],
    enabled: !!user?.userId,
  });

  // Fetch Top Reward income history
  const { data: topRewardHistory, isLoading: historyLoading } = useQuery<TopRewardIncome[]>({
    queryKey: ['/api/user/top-reward-history'],
  });

  const topRewardIncome = incomeSummary?.topRewardIncome ? parseFloat(incomeSummary.topRewardIncome) || 0 : 0;
  const topRewardAmount = systemConfig?.topRewardAmount || 500;
  const confirmedCount = topRewardHistory?.filter(t => t.status === 'confirmed').length || 0;
  const pendingCount = topRewardHistory?.filter(t => t.status === 'pending').length || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Link href="/user/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-600" />
          <h1 className="text-3xl font-bold text-black">Top Reward Income</h1>
        </div>
        <p className="text-muted-foreground">Track your Top Reward earnings and payment history</p>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Earnings Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-black">₹{topRewardIncome.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-muted-foreground mt-1">From all Top Reward payments</p>
                </div>
                <DollarSign className="w-8 h-8 text-amber-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Confirmed Payments Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-black">{confirmedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Confirmed payments</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Payments Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-black">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending confirmations</p>
                </div>
                <Clock className="w-8 h-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment History */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Calendar className="w-5 h-5" />
            Payment History
          </CardTitle>
          <CardDescription>Top Reward payments received</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : !topRewardHistory || topRewardHistory.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-2 opacity-50" />
              <p className="text-muted-foreground">No Top Reward payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topRewardHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Trophy className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">
                        {payment.sourceName || 'Admin'} - Top Reward Payment
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-black">₹{parseFloat(payment.amountInr).toLocaleString('en-IN')}</p>
                      <Badge variant={getStatusBadge(payment.status)} className="mt-1">
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </div>
                    {getStatusIcon(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-50/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-black flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-600" />
            About Top Reward
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-black space-y-2">
          <p>Top Reward is a special income stream paid as part of your activation process (Slot 2 of 8 payments).</p>
          <p>Payment per Top Reward: <span className="font-bold">₹{topRewardAmount.toLocaleString('en-IN')}</span></p>
          <p className="text-muted-foreground">Top Reward payments are managed by the admin and assigned based on priority-based recipient list.</p>
        </CardContent>
      </Card>
    </div>
  );
}
