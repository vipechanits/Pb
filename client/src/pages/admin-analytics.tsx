import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserCheck, 
  CheckCircle2, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  GitBranch,
  Grid3x3
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    completed: number;
  };
  payments: {
    totalConfirmed: number;
    totalAmount: number;
    pendingCount: number;
  };
  reentry: {
    totalCycles: number;
    completedCycles: number;
    inProgressCycles: number;
    eligibleUsers: number;
  };
  binary: {
    totalPairs: number;
    avgLeftLeg: number;
    avgRightLeg: number;
  };
  matrix: {
    totalPlacements: number;
    avgLevel: number;
  };
}

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics'],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  // Helper functions to safely calculate percentages
  const safePercentage = (numerator: number, denominator: number): string => {
    if (denominator === 0) return '0.0';
    return ((numerator / denominator) * 100).toFixed(1);
  };

  const safeWidth = (numerator: number, denominator: number): number => {
    if (denominator === 0) return 0;
    return (numerator / denominator) * 100;
  };

  const statCards = [
    {
      title: 'Total Users',
      value: analytics.users.total.toLocaleString(),
      description: `${analytics.users.active} active users`,
      icon: Users,
      trend: '+12% from last month',
    },
    {
      title: 'Completed Activations',
      value: analytics.users.completed.toLocaleString(),
      description: `${safePercentage(analytics.users.completed, analytics.users.total)}% completion rate`,
      icon: UserCheck,
      trend: null,
    },
    {
      title: 'Total Payments',
      value: `₹${analytics.payments.totalAmount.toLocaleString()}`,
      description: `${analytics.payments.totalConfirmed} confirmed payments`,
      icon: DollarSign,
      trend: '+8% from last month',
    },
    {
      title: 'Pending Payments',
      value: analytics.payments.pendingCount.toLocaleString(),
      description: 'Awaiting confirmation',
      icon: CheckCircle2,
      trend: null,
    },
    {
      title: 'Re-entry Cycles',
      value: analytics.reentry.totalCycles.toLocaleString(),
      description: `${analytics.reentry.completedCycles} completed`,
      icon: RefreshCw,
      trend: `${analytics.reentry.eligibleUsers} users eligible`,
    },
    {
      title: 'Binary Pairs',
      value: analytics.binary.totalPairs.toLocaleString(),
      description: `Avg L: ${analytics.binary.avgLeftLeg.toFixed(1)}, R: ${analytics.binary.avgRightLeg.toFixed(1)}`,
      icon: GitBranch,
      trend: null,
    },
    {
      title: 'Matrix Placements',
      value: analytics.matrix.totalPlacements.toLocaleString(),
      description: `Avg level: ${analytics.matrix.avgLevel.toFixed(1)}`,
      icon: Grid3x3,
      trend: null,
    },
    {
      title: 'Growth Rate',
      value: '+24%',
      description: 'New users this month',
      icon: TrendingUp,
      trend: 'Compared to last month',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive overview of platform performance and key metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              {stat.trend && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {stat.trend}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-user-distribution">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Users</span>
                <span className="font-medium">{analytics.users.active}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${safeWidth(analytics.users.active, analytics.users.total)}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed Activations</span>
                <span className="font-medium">{analytics.users.completed}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-600 dark:bg-green-400 h-2 rounded-full" 
                  style={{ width: `${safeWidth(analytics.users.completed, analytics.users.total)}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Re-entry Eligible</span>
                <span className="font-medium">{analytics.reentry.eligibleUsers}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full" 
                  style={{ width: `${safeWidth(analytics.reentry.eligibleUsers, analytics.users.total)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-payment-overview">
          <CardHeader>
            <CardTitle>Payment Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confirmed Payments</span>
                <span className="font-medium">{analytics.payments.totalConfirmed}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-600 dark:bg-green-400 h-2 rounded-full" 
                  style={{ 
                    width: `${safeWidth(analytics.payments.totalConfirmed, analytics.payments.totalConfirmed + analytics.payments.pendingCount)}%` 
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending Payments</span>
                <span className="font-medium">{analytics.payments.pendingCount}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full" 
                  style={{ 
                    width: `${safeWidth(analytics.payments.pendingCount, analytics.payments.totalConfirmed + analytics.payments.pendingCount)}%` 
                  }}
                />
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold">₹{analytics.payments.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-reentry-summary">
        <CardHeader>
          <CardTitle>Re-entry Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Cycles</p>
              <p className="text-2xl font-bold">{analytics.reentry.totalCycles}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Completed Cycles</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analytics.reentry.completedCycles}
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-600 dark:bg-green-400 h-2 rounded-full" 
                  style={{ 
                    width: `${safeWidth(analytics.reentry.completedCycles, analytics.reentry.totalCycles)}%` 
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.reentry.inProgressCycles}
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" 
                  style={{ 
                    width: `${safeWidth(analytics.reentry.inProgressCycles, analytics.reentry.totalCycles)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
