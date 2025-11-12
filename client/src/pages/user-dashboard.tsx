import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Users, GitBranch, Grid3x3, TrendingUp, Copy, Check, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Rocket, UserCheck, Loader2, RefreshCw, Trophy, Calendar, DollarSign, UserPlus, GitMerge, Layers } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import MiniBinaryTree from '@/components/MiniBinaryTree';
import MiniMatrixTree from '@/components/MiniMatrixTree';

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

interface ReentryStatus {
  isEligibleForReentry: boolean;
  isMatrixComplete: boolean;
  currentCycleNumber: number;
  reentryCount: number;
  currentReentry: {
    id: string;
    userId: string;
    cycleNumber: number;
    status: string;
    initiatedAt: string | null;
    completedAt: string | null;
    activationId: string | null;
  } | null;
  lastReentryAt: string | null;
}

interface ReentryHistory {
  id: string;
  userId: string;
  cycleNumber: number;
  status: string;
  initiatedAt: string | null;
  completedAt: string | null;
  activationId: string | null;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);
  const [showReentryDialog, setShowReentryDialog] = useState(false);

  const isActivated = user?.isActivated || false;

  // Fetch sponsor details if user has a sponsor
  const { data: sponsorData, isLoading: sponsorLoading } = useQuery<{ userId: string; name: string | null }>({
    queryKey: ['/api/users', user?.sponsorId, 'public'],
    enabled: !!user?.sponsorId,
  });

  // Fetch income summary
  const { data: incomeSummary } = useQuery<IncomeSummary>({
    queryKey: ['/api/users', user?.userId, 'income-summary'],
    enabled: !!user?.userId,
  });

  // Fetch re-entry status
  const { data: reentryStatus, isLoading: reentryStatusLoading } = useQuery<ReentryStatus>({
    queryKey: ['/api/reentry/status'],
    enabled: isActivated,
  });

  // Fetch re-entry history
  const { data: reentryHistory, isLoading: reentryHistoryLoading } = useQuery<ReentryHistory[]>({
    queryKey: ['/api/reentry/history'],
    enabled: isActivated,
  });

  // Fetch binary tree data (3 levels for preview)
  const { data: binaryTree } = useQuery<any>({
    queryKey: ['/api/users', user?.userId, 'binary-tree'],
    enabled: !!user?.userId,
  });

  // Fetch matrix tree data (3 levels for preview)
  const { data: matrixTree } = useQuery<any>({
    queryKey: ['/api/users', user?.userId, 'global-matrix'],
    enabled: !!user?.userId && isActivated,
  });

  // Initiate re-entry mutation
  const initiateReentryMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/reentry/initiate', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reentry/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reentry/history'] });
      toast({
        title: 'Re-entry initiated!',
        description: 'Your re-entry has been initiated. Complete 8 payments to activate.',
      });
      setShowReentryDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate re-entry',
        variant: 'destructive',
      });
      setShowReentryDialog(false);
    },
  });
  const baseUrl = window.location.origin;
  const leftLegLink = `${baseUrl}/auth/signup?ref=${user?.userId}&leg=left`;
  const rightLegLink = `${baseUrl}/auth/signup?ref=${user?.userId}&leg=right`;

  const copyToClipboard = async (text: string, leg: 'left' | 'right') => {
    try {
      await navigator.clipboard.writeText(text);
      if (leg === 'left') {
        setCopiedLeft(true);
        setTimeout(() => setCopiedLeft(false), 2000);
      } else {
        setCopiedRight(true);
        setTimeout(() => setCopiedRight(false), 2000);
      }
      toast({
        title: 'Copied!',
        description: `${leg === 'left' ? 'Left' : 'Right'} leg referral link copied`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

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

  const incomeCards = [
    {
      title: 'Total Income',
      value: `₹${totalEarnings.toLocaleString('en-IN')}`,
      description: 'All time earnings',
      icon: DollarSign,
      link: '/user/income/total',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      title: 'Direct Sponsor Income',
      value: `₹${sponsorIncome.toLocaleString('en-IN')}`,
      description: 'From direct referrals',
      icon: UserPlus,
      link: '/user/income/sponsor',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Binary Match Income',
      value: `₹${binaryIncome.toLocaleString('en-IN')}`,
      description: 'From binary tree matching',
      icon: GitMerge,
      link: '/user/income/binary',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Matrix Income',
      value: `₹${matrixIncome.toLocaleString('en-IN')}`,
      description: 'From matrix levels 1-5',
      icon: Layers,
      link: '/user/income/matrix',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
  ];

  const stats = [
    {
      title: 'Total Referrals',
      value: user?.totalReferrals?.toString() || '0',
      description: 'Users you sponsored',
      icon: Users,
    },
    {
      title: 'Left Leg Team',
      value: user?.leftLegCount?.toString() || '0',
      description: 'Active members',
      icon: ArrowLeft,
    },
    {
      title: 'Right Leg Team',
      value: user?.rightLegCount?.toString() || '0',
      description: 'Active members',
      icon: ArrowRight,
    },
    {
      title: 'Total Earnings',
      value: `₹${totalEarnings.toLocaleString('en-IN')}`,
      description: 'All time income',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8" data-testid="user-dashboard">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Welcome, {user?.name || user?.email}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              User ID: <span className="font-mono font-semibold text-foreground">{user?.userId || 'Not assigned'}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isActivated ? (
              <Badge variant="default" className="gap-1.5 px-3 py-1.5" data-testid="badge-activated">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Activated</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5" data-testid="badge-not-activated">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Not Activated</span>
              </Badge>
            )}
            
            {isActivated && reentryStatus?.isEligibleForReentry && (
              <Badge variant="default" className="gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700" data-testid="badge-reentry-eligible">
                <Trophy className="w-4 h-4" />
                <span className="font-medium">Re-entry Eligible</span>
              </Badge>
            )}
            
            {isActivated && reentryStatus?.currentReentry?.status === 'in_progress' && (
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-blue-500 text-blue-500" data-testid="badge-reentry-in-progress">
                <RefreshCw className="w-4 h-4" />
                <span className="font-medium">Re-entry In Progress</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Sponsorship & Placement Information */}
      {user?.sponsorId && (
        <Card className="border-accent/20 bg-accent/5" data-testid="card-sponsor-info">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-accent" />
              <div>
                <CardTitle className="text-lg">Sponsorship & Placement</CardTitle>
                <CardDescription>Your position in the binary tree</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Sponsor</p>
                {sponsorLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-lg font-semibold" data-testid="text-sponsor-name">
                      {sponsorData?.name || 'Name not set'}
                    </p>
                    <p className="text-sm font-mono text-muted-foreground" data-testid="text-sponsor-id">
                      {user.sponsorId}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Binary Leg</p>
                <div className="flex items-center gap-2">
                  {user.binaryLeg === 'left' ? (
                    <>
                      <ArrowLeft className="w-5 h-5 text-blue-500" />
                      <Badge variant="outline" className="border-blue-500 text-blue-500" data-testid="badge-binary-leg">
                        Left Leg
                      </Badge>
                    </>
                  ) : user.binaryLeg === 'right' ? (
                    <>
                      <ArrowRight className="w-5 h-5 text-green-500" />
                      <Badge variant="outline" className="border-green-500 text-green-500" data-testid="badge-binary-leg">
                        Right Leg
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="secondary" data-testid="badge-binary-leg">Not Assigned</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activation Status Alert */}
      {!isActivated && (
        <Alert className="border-primary/20 bg-primary/5">
          <Rocket className="h-4 w-4" />
          <AlertTitle>Complete Your Activation</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Your account is not yet activated. Complete all 8 payments to activate your account and start earning!</p>
            <Link href="/user/activation">
              <Button size="sm" className="mt-2" data-testid="button-complete-activation">
                Complete Activation →
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Referral Links - Only shown after activation */}
      {isActivated && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Your Referral Links</CardTitle>
                <CardDescription>Share these links to build your binary team and start earning</CardDescription>
              </div>
              <Badge variant="default" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {/* Left Leg Link */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ArrowLeft className="w-4 h-4 text-blue-500" />
                  Left Leg
                </div>
                <div className="flex gap-2">
                  <Input value={leftLegLink} readOnly className="text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(leftLegLink, 'left')}
                    data-testid="button-copy-left-dashboard"
                  >
                    {copiedLeft ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Right Leg Link */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ArrowRight className="w-4 h-4 text-green-500" />
                  Right Leg
                </div>
                <div className="flex gap-2">
                  <Input value={rightLegLink} readOnly className="text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(rightLegLink, 'right')}
                    data-testid="button-copy-right-dashboard"
                  >
                    {copiedRight ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Re-entry System - Only shown after activation */}
      {isActivated && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <CardTitle className="text-lg">Re-entry System</CardTitle>
                  <CardDescription>Complete matrix to re-enter and earn again</CardDescription>
                </div>
              </div>
              {reentryStatus?.currentReentry && (
                <Badge variant="outline" className="border-blue-500 text-blue-500">
                  Cycle #{reentryStatus.currentReentry.cycleNumber}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Matrix Completion Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Matrix Status</span>
                {reentryStatus?.isMatrixComplete ? (
                  <Badge variant="default" className="gap-1 bg-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Complete (62/62)
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Grid3x3 className="w-3 h-3" />
                    Building
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                You need 62 activated descendants in your matrix to qualify for re-entry
              </p>
            </div>

            {/* Status and Action */}
            {reentryStatusLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading re-entry status...</span>
              </div>
            ) : reentryStatus?.currentReentry?.status === 'in_progress' ? (
              <Alert className="border-blue-500/20 bg-blue-500/5">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                <AlertTitle>Re-entry In Progress</AlertTitle>
                <AlertDescription>
                  You have initiated re-entry. Complete 8 activation payments to finish this cycle.
                  {reentryStatus.currentReentry.activationId && (
                    <Link href="/user/activation">
                      <Button size="sm" variant="outline" className="mt-2 border-blue-500 text-blue-500" data-testid="button-continue-reentry">
                        Continue Activation →
                      </Button>
                    </Link>
                  )}
                </AlertDescription>
              </Alert>
            ) : reentryStatus?.isEligibleForReentry ? (
              <div className="space-y-3">
                <Alert className="border-amber-500/20 bg-amber-500/5">
                  <Trophy className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Congratulations! You're Eligible for Re-entry</AlertTitle>
                  <AlertDescription>
                    You've completed your matrix with 62 activated descendants. Click below to re-enter and start earning again!
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => setShowReentryDialog(true)}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  data-testid="button-initiate-reentry"
                  disabled={initiateReentryMutation.isPending}
                >
                  {initiateReentryMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initiating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Initiate Re-entry
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Alert>
                <Grid3x3 className="h-4 w-4" />
                <AlertTitle>Keep Building Your Matrix</AlertTitle>
                <AlertDescription>
                  Complete your matrix with 62 activated descendants to become eligible for re-entry.
                </AlertDescription>
              </Alert>
            )}

            {/* Re-entry History */}
            {reentryHistory && reentryHistory.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  Re-entry History
                </div>
                <div className="space-y-2">
                  {reentryHistory.slice(0, 5).map((cycle) => (
                    <div key={cycle.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-card" data-testid={`reentry-cycle-${cycle.cycleNumber}`}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Cycle #{cycle.cycleNumber}
                        </Badge>
                        <span className="text-muted-foreground">
                          {cycle.status === 'completed' && cycle.completedAt
                            ? format(new Date(cycle.completedAt), 'MMM dd, yyyy')
                            : cycle.status === 'in_progress' && cycle.initiatedAt
                            ? `Started ${format(new Date(cycle.initiatedAt), 'MMM dd, yyyy')}`
                            : 'Pending'}
                        </span>
                      </div>
                      <Badge 
                        variant={cycle.status === 'completed' ? 'default' : cycle.status === 'in_progress' ? 'outline' : 'secondary'}
                        className={cycle.status === 'in_progress' ? 'border-blue-500 text-blue-500' : ''}
                      >
                        {cycle.status === 'completed' ? 'Completed' : cycle.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Income Summary - Only shown after activation */}
      {isActivated && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Income Summary</h2>
            <p className="text-muted-foreground">Click on any card to view detailed breakdown and statistics</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {incomeCards.map((card) => (
              <Link key={card.title} href={card.link}>
                <Card 
                  className={`hover-elevate active-elevate-2 cursor-pointer transition-all ${card.bgColor} ${card.borderColor}`}
                  data-testid={`card-income-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Team Tree Previews - Only shown after activation */}
      {isActivated && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Binary Tree Preview */}
          <Card data-testid="card-binary-tree-preview">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-green-600" />
                    Binary Tree Preview
                  </CardTitle>
                  <CardDescription>Your binary sponsorship tree (3 levels)</CardDescription>
                </div>
                <Link href="/user/binary-tree">
                  <Button variant="outline" size="sm" data-testid="button-view-full-binary-tree">
                    View Full Tree →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {binaryTree ? (
                <MiniBinaryTree root={binaryTree} maxDepth={3} />
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Matrix Tree Preview */}
          <Card data-testid="card-matrix-tree-preview">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3x3 className="w-5 h-5 text-purple-600" />
                    Matrix Tree Preview
                  </CardTitle>
                  <CardDescription>Your global matrix placement (3 levels)</CardDescription>
                </div>
                <Link href="/user/global-matrix">
                  <Button variant="outline" size="sm" data-testid="button-view-full-matrix-tree">
                    View Full Tree →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {matrixTree ? (
                <MiniMatrixTree root={matrixTree} maxDepth={3} />
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
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

      {!isActivated && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Complete your activation to unlock all features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li className="text-muted-foreground">Complete your profile with payment details</li>
                <li className="font-medium">Complete all 8 activation payments</li>
                <li className="text-muted-foreground">Wait for payment confirmations</li>
                <li className="text-muted-foreground">Your account will be automatically activated</li>
                <li className="text-muted-foreground">Start sharing referral links and earning!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Re-entry Confirmation Dialog */}
      <AlertDialog open={showReentryDialog} onOpenChange={setShowReentryDialog}>
        <AlertDialogContent data-testid="dialog-reentry-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-600" />
              Confirm Re-entry
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to initiate a re-entry into the PAYBACK247 system. This will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Create a new activation cycle requiring 8 payments of ₹500 each</li>
                <li>Place you back in the global matrix system</li>
                <li>Allow you to earn from all income streams again</li>
              </ul>
              <p className="font-semibold">
                Total investment: ₹5,000 (8 × ₹500)
              </p>
              <p className="text-xs text-muted-foreground">
                You will need to complete all 8 peer-to-peer payments to activate this cycle.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reentry">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => initiateReentryMutation.mutate()}
              disabled={initiateReentryMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
              data-testid="button-confirm-reentry"
            >
              {initiateReentryMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initiating...
                </>
              ) : (
                'Confirm Re-entry'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
