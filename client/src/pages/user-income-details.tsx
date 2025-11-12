import { useParams, useLocation, Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, DollarSign, UserPlus, GitMerge, Layers, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import BinaryTreeView from '@/components/BinaryTreeView';
import MatrixTreeView from '@/components/MatrixTreeView';
import { format } from 'date-fns';

interface IncomeSummary {
  totalEarnings: string;
  directSponsorIncome: string;
  binaryMatchIncome: string;
  matrixLevel1Income: string;
  matrixLevel2Income: string;
  matrixLevel3Income: string;
  matrixLevel4Income: string;
  matrixLevel5Income: string;
}

export default function UserIncomeDetailsPage() {
  const { type } = useParams<{ type: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Fetch income summary
  const { data: incomeSummary, isLoading: summaryLoading } = useQuery<IncomeSummary>({
    queryKey: ['/api/users', user?.userId, 'income-summary'],
    enabled: !!user?.userId,
  });

  // Fetch binary tree (for binary income type)
  const { data: binaryTree, isLoading: binaryLoading } = useQuery<any>({
    queryKey: ['/api/users', user?.userId, 'binary-tree'],
    enabled: !!user?.userId && type === 'binary',
  });

  // Fetch matrix tree (for matrix income type)
  const { data: matrixTree, isLoading: matrixLoading } = useQuery<any>({
    queryKey: ['/api/users', user?.userId, 'global-matrix'],
    enabled: !!user?.userId && (type === 'matrix' || type === 'total'),
  });

  // Calculate income values with null-safety
  const totalEarnings = incomeSummary?.totalEarnings ? parseFloat(incomeSummary.totalEarnings) || 0 : 0;
  const sponsorIncome = incomeSummary?.directSponsorIncome ? parseFloat(incomeSummary.directSponsorIncome) || 0 : 0;
  const binaryIncome = incomeSummary?.binaryMatchIncome ? parseFloat(incomeSummary.binaryMatchIncome) || 0 : 0;
  const matrixIncome = incomeSummary 
    ? (parseFloat(incomeSummary.matrixLevel1Income || '0') || 0) +
      (parseFloat(incomeSummary.matrixLevel2Income || '0') || 0) +
      (parseFloat(incomeSummary.matrixLevel3Income || '0') || 0) +
      (parseFloat(incomeSummary.matrixLevel4Income || '0') || 0) +
      (parseFloat(incomeSummary.matrixLevel5Income || '0') || 0)
    : 0;

  // Income type configuration
  const incomeConfig: Record<string, { title: string; icon: any; value: number; color: string; description: string }> = {
    total: {
      title: 'Total Income',
      icon: DollarSign,
      value: totalEarnings,
      color: 'text-green-600',
      description: 'All earnings from all income sources',
    },
    sponsor: {
      title: 'Direct Sponsor Income',
      icon: UserPlus,
      value: sponsorIncome,
      color: 'text-blue-600',
      description: 'Earnings from users you directly sponsored',
    },
    binary: {
      title: 'Binary Match Income',
      icon: GitMerge,
      value: binaryIncome,
      color: 'text-purple-600',
      description: 'Earnings from binary tree matching bonuses',
    },
    matrix: {
      title: 'Matrix Income',
      icon: Layers,
      value: matrixIncome,
      color: 'text-amber-600',
      description: 'Combined earnings from matrix levels 1-5',
    },
    reentry: {
      title: 'Matrix Re-entry Income',
      icon: TrendingUp,
      value: 0, // TODO: Calculate from re-entry transactions
      color: 'text-emerald-600',
      description: 'Earnings from completed re-entry cycles',
    },
  };

  const config = incomeConfig[type || 'total'];

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invalid income type. Please select a valid income category.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/user/dashboard')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Link href="/user/dashboard">
          <Button variant="ghost" size="sm" data-testid="button-back-to-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${config.color}`} />
          <div>
            <h1 className="text-3xl font-bold">{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Income Summary Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            Total Earnings
          </CardTitle>
          <CardDescription>Lifetime earnings from this income source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold ${config.color}`}>
            ₹{config.value.toLocaleString('en-IN')}
          </div>
        </CardContent>
      </Card>

      {/* Matrix Income Breakdown */}
      {type === 'matrix' && incomeSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Matrix Level Breakdown</CardTitle>
            <CardDescription>Detailed earnings by matrix level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((level) => {
                const key = `matrixLevel${level}Income` as keyof IncomeSummary;
                const amount = parseFloat(incomeSummary[key] || '0');
                return (
                  <div key={level} className="space-y-1 p-3 rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground">Level {level}</p>
                    <p className="text-lg font-semibold text-amber-600">
                      ₹{amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Binary Tree Visualization */}
      {type === 'binary' && (
        <Card data-testid="card-binary-tree-full">
          <CardHeader>
            <CardTitle>Binary Tree Structure</CardTitle>
            <CardDescription>Your complete binary sponsorship tree (5 levels deep)</CardDescription>
          </CardHeader>
          <CardContent>
            {binaryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : binaryTree ? (
              <BinaryTreeView root={binaryTree} />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No binary tree data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Matrix Tree Visualization */}
      {(type === 'matrix' || type === 'total') && (
        <div data-testid="card-matrix-tree-full">
          {matrixLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : matrixTree ? (
            <MatrixTreeView root={matrixTree} />
          ) : (
            <Card>
              <CardContent className="text-center text-muted-foreground py-8">
                <p>Not placed in matrix yet. Complete activation to be placed.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Income Statistics</CardTitle>
          <CardDescription>Detailed breakdown and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className={`text-2xl font-bold ${config.color}`}>
                ₹{config.value.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Estimated Payments</p>
              <p className="text-2xl font-bold">{config.value > 0 ? Math.floor(config.value / 500) : 0}</p>
              <p className="text-xs text-muted-foreground">Based on ₹500 per payment</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History - Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Detailed list of all income transactions (Coming Soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Transaction history is coming soon</p>
              <p className="text-sm mt-1">We're working on building a comprehensive transaction history feature with detailed filtering and export capabilities.</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
