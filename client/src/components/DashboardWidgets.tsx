import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Target,
  CheckCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'wouter';

interface ProgressWidgetProps {
  currentCycle?: number;
  isActivated: boolean;
  matrixComplete?: boolean;
}

export function ProgressWidget({ currentCycle = 1, isActivated, matrixComplete }: ProgressWidgetProps) {
  const progress = matrixComplete ? 100 : isActivated ? 50 : 0;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cycle #{currentCycle}</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {isActivated ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              <span>Activated</span>
            </div>
            <p className="font-semibold">{isActivated ? 'Yes' : 'Pending'}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {matrixComplete ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              <span>Matrix</span>
            </div>
            <p className="font-semibold">{matrixComplete ? 'Complete' : 'In Progress'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TeamStatsProps {
  totalReferrals: number;
  leftLeg: number;
  rightLeg: number;
}

export function TeamStats({ totalReferrals, leftLeg, rightLeg }: TeamStatsProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium">Direct Referrals</span>
            <Badge variant="secondary" className="text-lg font-bold">
              {totalReferrals}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="text-xs text-muted-foreground mb-1">Left Leg</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {leftLeg}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <div className="text-xs text-muted-foreground mb-1">Right Leg</div>
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {rightLeg}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EarningsOverviewProps {
  totalEarnings: number;
  sponsorIncome: number;
  binaryIncome: number;
  matrixIncome: number;
}

export function EarningsOverview({ 
  totalEarnings, 
  sponsorIncome, 
  binaryIncome, 
  matrixIncome 
}: EarningsOverviewProps) {
  const incomeStreams = [
    { label: 'Sponsor', amount: sponsorIncome, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Binary', amount: binaryIncome, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Matrix', amount: matrixIncome, color: 'text-pink-600 dark:text-pink-400' },
  ];
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Earnings
          </CardTitle>
          <Link 
            href="/user/transaction-history"
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="text-sm text-muted-foreground mb-1">Total Earnings</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            ₹{totalEarnings.toLocaleString('en-IN')}
          </div>
        </div>
        
        <div className="space-y-2">
          {incomeStreams.map((stream) => (
            <div key={stream.label} className="flex items-center justify-between p-2 rounded bg-muted/30">
              <span className="text-sm text-muted-foreground">{stream.label}</span>
              <span className={`text-sm font-semibold ${stream.color}`}>
                ₹{stream.amount.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
