import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid3x3, DollarSign, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';

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

export default function MatrixIncome() {
  const { user } = useAuth();

  const { data: incomeSummary } = useQuery<IncomeSummary>({
    queryKey: ['/api/users', user?.userId, 'income-summary'],
    enabled: !!user?.userId,
  });

  const matrixEarnings = incomeSummary ? 
    parseFloat(incomeSummary.matrixLevel1Income || '0') +
    parseFloat(incomeSummary.matrixLevel2Income || '0') +
    parseFloat(incomeSummary.matrixLevel3Income || '0') +
    parseFloat(incomeSummary.matrixLevel4Income || '0') +
    parseFloat(incomeSummary.matrixLevel5Income || '0') : 0;

  const level1Filled = incomeSummary ? Math.floor(parseFloat(incomeSummary.matrixLevel1Income || '0') / 500) : 0;
  const level2Filled = incomeSummary ? Math.floor(parseFloat(incomeSummary.matrixLevel2Income || '0') / 500) : 0;
  const level3Filled = incomeSummary ? Math.floor(parseFloat(incomeSummary.matrixLevel3Income || '0') / 500) : 0;
  const level4Filled = incomeSummary ? Math.floor(parseFloat(incomeSummary.matrixLevel4Income || '0') / 500) : 0;
  const level5Filled = incomeSummary ? Math.floor(parseFloat(incomeSummary.matrixLevel5Income || '0') / 500) : 0;
  
  const totalFilled = level1Filled + level2Filled + level3Filled + level4Filled + level5Filled;
  const activeLevels = [level1Filled > 0, level2Filled > 0, level3Filled > 0, level4Filled > 0, level5Filled > 0].filter(Boolean).length;

  const matrixLevels = [
    { level: 1, positions: 2, filled: level1Filled, earning: '₹500 per position' },
    { level: 2, positions: 4, filled: level2Filled, earning: '₹500 per position' },
    { level: 3, positions: 8, filled: level3Filled, earning: '₹500 per position' },
    { level: 4, positions: 16, filled: level4Filled, earning: '₹500 per position' },
    { level: 5, positions: 32, filled: level5Filled, earning: '₹500 per position' },
  ];

  const stats = [
    {
      title: 'Matrix Earnings',
      value: `₹${matrixEarnings.toLocaleString('en-IN')}`,
      description: 'From 5 levels',
      icon: DollarSign,
    },
    {
      title: 'Total Positions',
      value: `${totalFilled}/62`,
      description: 'Filled positions',
      icon: Grid3x3,
    },
    {
      title: 'Active Levels',
      value: `${activeLevels}/5`,
      description: 'Completed levels',
      icon: TrendingUp,
    },
    {
      title: 'Matrix Team',
      value: totalFilled.toString(),
      description: 'Members in matrix',
      icon: Users,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Matrix Income</h1>
        <p className="text-muted-foreground">
          Track your 2+5 matrix levels and passive income
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
          <CardTitle>Matrix Level Status</CardTitle>
          <CardDescription>Track your 5-level matrix progression</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {matrixLevels.map((level) => (
              <div key={level.level} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-sm">{level.level}</span>
                  </div>
                  <div>
                    <p className="font-medium">Level {level.level}</p>
                    <p className="text-xs text-muted-foreground">{level.earning}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{level.filled}/{level.positions}</p>
                  <Badge variant={level.filled === 0 ? "secondary" : "default"} className="text-xs">
                    {level.filled === 0 ? 'Empty' : `${Math.round((level.filled / level.positions) * 100)}%`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How the 2+5 Matrix Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">Non-Working Matrix</h4>
            <p className="text-muted-foreground">You only need 2 direct referrals. The system automatically places additional members in your 5-level matrix.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Passive Income</h4>
            <p className="text-muted-foreground">Earn ₹625 from each position filled in your matrix across all 5 levels (total 62 positions).</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Unlimited Re-entry</h4>
            <p className="text-muted-foreground">Once your matrix is complete, you can re-enter to create new cycles and compound your earnings.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Total Potential</h4>
            <p className="text-muted-foreground font-semibold">₹31,000 from one complete 2+5 cycle (62 positions × ₹625 - ₹7,000 reentry)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matrix Income History</CardTitle>
          <CardDescription>Earnings from each matrix level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            No matrix earnings yet
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
