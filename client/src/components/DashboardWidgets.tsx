import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Target,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Zap
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
    <Card className="overflow-hidden border-0 shadow-md">
      <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-black">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Target className="w-4 h-4 text-primary" />
          </div>
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cycle #{currentCycle}</span>
            <Badge variant="secondary" className="font-mono text-xs">{progress}%</Badge>
          </div>
          <Progress value={progress} className="h-2.5" />
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-black">
              {isActivated ? (
                <CheckCircle className="w-3.5 h-3.5 text-success" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-warning" />
              )}
              <span>Status</span>
            </div>
            <p className="font-semibold text-sm text-black">{isActivated ? 'Active' : 'Pending'}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-black">
              {matrixComplete ? (
                <CheckCircle className="w-3.5 h-3.5 text-success" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-info" />
              )}
              <span>Matrix</span>
            </div>
            <p className="font-semibold text-sm text-black">{matrixComplete ? 'Complete' : 'Building'}</p>
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
    <Card className="overflow-hidden border-0 shadow-md">
      <CardHeader className="bg-gradient-to-br from-info/10 via-info/5 to-transparent pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-black">
          <div className="p-1.5 rounded-md bg-info/10">
            <Users className="w-4 h-4 text-info" />
          </div>
          Team Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium text-black">Direct Referrals</span>
            <Badge className="bg-primary/10 text-primary font-mono text-base font-bold border-0">
              {totalReferrals}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
              <div className="text-xs text-black mb-1 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Left Leg
              </div>
              <div className="text-2xl font-bold font-mono text-black">
                {leftLeg}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/10">
              <div className="text-xs text-black mb-1 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
                Right Leg
              </div>
              <div className="text-2xl font-bold font-mono text-black">
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
  topRewardIncome?: number;
}

export function EarningsOverview({ 
  totalEarnings, 
  sponsorIncome, 
  binaryIncome, 
  matrixIncome,
  topRewardIncome = 0
}: EarningsOverviewProps) {
  const incomeStreams = [
    { label: 'Sponsor', amount: sponsorIncome, icon: '1' },
    { label: 'Binary', amount: binaryIncome, icon: '2' },
    { label: 'Top Reward', amount: topRewardIncome, icon: '3' },
    { label: 'Matrix', amount: matrixIncome, icon: '4' },
  ];
  
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardHeader className="bg-gradient-to-br from-success/10 via-success/5 to-transparent pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-black">
            <div className="p-1.5 rounded-md bg-success/10">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            Earnings
          </CardTitle>
          <Link 
            href="/user/transaction-history"
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            View All
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
          <div className="text-xs text-black mb-1 uppercase tracking-wide">Total Earnings</div>
          <div className="text-3xl font-bold font-mono text-black">
            ₹{totalEarnings.toLocaleString('en-IN')}
          </div>
        </div>
        
        <div className="space-y-2">
          {incomeStreams.map((stream) => (
            <div key={stream.label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {stream.icon}
                </span>
                <span className="text-sm text-black">{stream.label}</span>
              </div>
              <span className="text-sm font-semibold font-mono text-black">
                ₹{stream.amount.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
