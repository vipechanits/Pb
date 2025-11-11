import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, TrendingUp, DollarSign, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';

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

export default function BinaryMatching() {
  const { user } = useAuth();

  const { data: incomeSummary } = useQuery<IncomeSummary>({
    queryKey: ['/api/users', user?.userId, 'income-summary'],
    enabled: !!user?.userId,
  });

  const binaryEarnings = incomeSummary?.binaryMatchIncome ? parseFloat(incomeSummary.binaryMatchIncome) : 0;
  const binaryMatches = Math.floor(binaryEarnings / 1000);

  const stats = [
    {
      title: 'Binary Matches',
      value: binaryMatches.toString(),
      description: 'Completed matches',
      icon: GitBranch,
    },
    {
      title: 'Left Leg',
      value: user?.leftLegCount?.toString() || '0',
      description: 'Members on left',
      icon: Users,
    },
    {
      title: 'Right Leg',
      value: user?.rightLegCount?.toString() || '0',
      description: 'Members on right',
      icon: Users,
    },
    {
      title: 'Binary Earnings',
      value: `₹${binaryEarnings.toLocaleString('en-IN')}`,
      description: 'From matches',
      icon: DollarSign,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Binary Matching</h1>
        <p className="text-muted-foreground">
          Track your binary tree and matching income
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Binary Tree Structure</CardTitle>
          <CardDescription>Your position in the global binary queue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No binary tree data yet</p>
            <p className="text-sm">Your binary tree will appear here once members join your network</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Binary Matching Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. Left & Right Legs</h4>
            <p className="text-muted-foreground">Share separate referral links for left and right leg placement</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Global FIFO Queue</h4>
            <p className="text-muted-foreground">New members enter a global queue for binary matching</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Automatic Pairing</h4>
            <p className="text-muted-foreground">System matches pairs automatically from the queue</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Earn ₹625</h4>
            <p className="text-muted-foreground">Both matched members pay each other ₹625</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Match History</CardTitle>
          <CardDescription>Your completed binary matches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            No matches yet
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
