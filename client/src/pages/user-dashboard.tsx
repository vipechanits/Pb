import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Users, GitBranch, Grid3x3, TrendingUp, Copy, Check, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Rocket, UserCheck, Loader2, RefreshCw, Trophy, Calendar, UserPlus, GitMerge, Layers } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import MiniBinaryTree from '@/components/MiniBinaryTree';
import MiniMatrixTree from '@/components/MiniMatrixTree';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardReferralLinks } from '@/components/dashboard/DashboardReferralLinks';
import { DashboardTreePreviews } from '@/components/dashboard/DashboardTreePreviews';
import { useSystemConfig } from '@/hooks/use-system-config';
import { QuickActions } from '@/components/QuickActions';
import { ProgressWidget, TeamStats, EarningsOverview } from '@/components/DashboardWidgets';
import { InstallAppButton } from '@/components/InstallAppButton';

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
  const { config, isLoading: configLoading } = useSystemConfig();
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

  // Fetch direct referrals
  const { data: directReferrals } = useQuery<any[]>({
    queryKey: ['/api/users', user?.userId, 'direct-referrals'],
    enabled: !!user?.userId,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5" data-testid="user-dashboard">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-20 lg:pb-8">
        {/* ===== SECTION 1: USER PROFILE & STATUS ===== */}
        <section className="space-y-4">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-3 border border-primary/20">
            <h2 className="text-xl font-bold dashboard-text">Account Overview</h2>
          </div>
          <DashboardHeader
            userName={user?.name}
            userEmail={user?.email}
            userId={user?.userId}
            isActivated={isActivated}
            reentryStatus={reentryStatus}
          />
        </section>

        {/* ===== SECTION 2: ACTIVATION STATUS ===== */}
        {!isActivated && (
          <section className="space-y-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg p-3 border border-amber-200/50 dark:border-amber-800/50">
              <h2 className="text-xl font-bold dashboard-text">Activation Required</h2>
            </div>
            <Alert className="border-2 border-amber-300/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 shadow-md">
              <Rocket className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-900 dark:text-amber-200 font-semibold">Complete Your Activation</AlertTitle>
              <AlertDescription className="space-y-3 text-amber-800/90 dark:text-amber-300/90">
                <p className="font-medium">Your account is not yet activated. Complete all 8 payments to unlock full earning potential!</p>
                <Link href="/user/activation">
                  <Button size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700 text-white" data-testid="button-complete-activation">
                    <Rocket className="mr-2 h-3 w-3" />
                    Complete Activation →
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          </section>
        )}

        {/* ===== SECTION 3: QUICK ACTIONS ===== */}
        <section className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/50 flex items-center justify-between">
            <h2 className="text-xl font-bold dashboard-text">Quick Actions</h2>
            <InstallAppButton />
          </div>
          <div className="hover-elevate">
            <QuickActions />
          </div>
        </section>

        {/* ===== SECTION 4: REFERRAL NETWORK (After Activation) ===== */}
        {isActivated && (
          <section className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-800/50">
              <h2 className="text-xl font-bold dashboard-text">Grow Your Network</h2>
              <p className="text-sm dashboard-text mt-1">Share referral links with your team members</p>
            </div>
            <div className="hover-elevate">
              <DashboardReferralLinks
                leftLegLink={leftLegLink}
                rightLegLink={rightLegLink}
                copiedLeft={copiedLeft}
                copiedRight={copiedRight}
                onCopyLeft={() => copyToClipboard(leftLegLink, 'left')}
                onCopyRight={() => copyToClipboard(rightLegLink, 'right')}
              />
            </div>
          </section>
        )}

        {/* ===== SECTION 5: PERFORMANCE METRICS (After Activation) ===== */}
        {isActivated && (
          <section className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-3 border border-purple-200/50 dark:border-purple-800/50">
              <h2 className="text-xl font-bold dashboard-text">Performance Overview</h2>
              <p className="text-sm dashboard-text mt-1">Your current cycle progress and earnings</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="hover-elevate">
                <ProgressWidget 
                  currentCycle={reentryStatus?.currentCycleNumber}
                  isActivated={isActivated}
                  matrixComplete={reentryStatus?.isMatrixComplete}
                />
              </div>
              <div className="hover-elevate">
                <TeamStats 
                  totalReferrals={directReferrals?.length || 0}
                  leftLeg={user?.leftLegCount || 0}
                  rightLeg={user?.rightLegCount || 0}
                />
              </div>
              <div className="hover-elevate">
                <EarningsOverview
                  totalEarnings={totalEarnings}
                  sponsorIncome={sponsorIncome}
                  binaryIncome={binaryIncome}
                  matrixIncome={matrixIncome}
                />
              </div>
            </div>
          </section>
        )}

        {/* ===== SECTION 6: INCOME BREAKDOWN (After Activation) ===== */}
        {isActivated && incomeSummary && (
          <section className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-lg p-3 border border-indigo-200/50 dark:border-indigo-800/50">
              <h2 className="text-xl font-bold dashboard-text">Income Streams</h2>
              <p className="text-sm dashboard-text mt-1">Detailed breakdown of your earnings by source</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/40 dark:to-cyan-950/40 shadow-md hover-elevate transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium dashboard-text">Direct Sponsor Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold dashboard-text">₹{parseFloat(incomeSummary.directSponsorIncome || '0').toLocaleString('en-IN')}</div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/40 shadow-md hover-elevate transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium dashboard-text">Binary Match Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold dashboard-text">₹{parseFloat(incomeSummary.binaryMatchIncome || '0').toLocaleString('en-IN')}</div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/40 dark:to-pink-950/40 shadow-md hover-elevate transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium dashboard-text">Matrix Income (5 Levels)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold dashboard-text">₹{matrixIncome.toLocaleString('en-IN')}</div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* ===== SECTION 7: BINARY & MATRIX TREES (After Activation) ===== */}
        {isActivated && (
          <section className="space-y-4">
            <div className="bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 rounded-lg p-3 border border-rose-200/50 dark:border-rose-800/50">
              <h2 className="text-xl font-bold dashboard-text">Network Trees</h2>
              <p className="text-sm dashboard-text mt-1">Visualize your binary placement and matrix positioning</p>
            </div>
            <div className="hover-elevate">
              <DashboardTreePreviews binaryTree={binaryTree} matrixTree={matrixTree} />
            </div>
          </section>
        )}

        {/* ===== SECTION 8: RE-ENTRY OPPORTUNITIES (After Matrix Completion) ===== */}
        {isActivated && reentryStatus?.isMatrixComplete && (
          <section className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-100/50 to-green-100/50 dark:from-emerald-900/40 dark:to-green-900/40 rounded-lg p-3 border border-emerald-300/50 dark:border-emerald-700/50">
              <h2 className="text-xl font-bold dashboard-text">Re-Entry Available</h2>
              <p className="text-sm dashboard-text mt-1">Congratulations! You can re-enter and earn more</p>
            </div>
            <Card className="border-0 border-t-4 border-t-green-500 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/40 dark:to-emerald-950/40 shadow-lg hover-elevate transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dashboard-text">
                  <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                  Matrix Completion
                </CardTitle>
                <CardDescription className="dashboard-text">
                  You have completed your matrix! Click below to initiate a new cycle and continue earning.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowReentryDialog(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md"
                  data-testid="button-initiate-reentry"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Initiate Re-entry
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ===== SECTION 9: GETTING STARTED (For Non-Activated Users) ===== */}
        {!isActivated && (
          <section className="space-y-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h2 className="text-xl font-bold dashboard-text">Getting Started</h2>
              <p className="text-sm dashboard-text mt-1">Follow these steps to activate your account</p>
            </div>
            <Card className="border-0 bg-white shadow-md">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-4 items-start p-3 rounded-lg hover-elevate transition-all duration-200 bg-white border border-gray-200">
                    <Badge className="mt-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm h-8 w-8 flex items-center justify-center rounded-full">1</Badge>
                    <div className="flex-1">
                      <p className="font-semibold dashboard-text">Complete Your Profile</p>
                      <p className="text-sm dashboard-text">Add payment details (UPI, Bank, etc.)</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start p-3 rounded-lg hover-elevate transition-all duration-200 bg-white border border-gray-200">
                    <Badge className="mt-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm h-8 w-8 flex items-center justify-center rounded-full">2</Badge>
                    <div className="flex-1">
                      <p className="font-semibold dashboard-text">Make 8 Payments</p>
                      <p className="text-sm dashboard-text">Complete all 8 peer-to-peer payments (₹5,000 total)</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start p-3 rounded-lg hover-elevate transition-all duration-200 bg-white border border-gray-200">
                    <Badge className="mt-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold text-sm h-8 w-8 flex items-center justify-center rounded-full">3</Badge>
                    <div className="flex-1">
                      <p className="font-semibold dashboard-text">Wait for Confirmations</p>
                      <p className="text-sm dashboard-text">Admin will verify and confirm each payment</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start p-3 rounded-lg hover-elevate transition-all duration-200 bg-white border border-gray-200">
                    <Badge className="mt-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-sm h-8 w-8 flex items-center justify-center rounded-full">4</Badge>
                    <div className="flex-1">
                      <p className="font-semibold dashboard-text">Account Activated</p>
                      <p className="text-sm dashboard-text">Automatic activation upon full payment confirmation</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start p-3 rounded-lg hover-elevate transition-all duration-200 bg-white border border-gray-200">
                    <Badge className="mt-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm h-8 w-8 flex items-center justify-center rounded-full">5</Badge>
                    <div className="flex-1">
                      <p className="font-semibold dashboard-text">Start Earning</p>
                      <p className="text-sm dashboard-text">Share referral links and build your network for income</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
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
                  <li>Create a new activation cycle requiring 8 payments to designated members</li>
                  <li>Place you back in the global matrix system</li>
                  <li>Allow you to earn from all income streams again</li>
                </ul>
                <p className="font-semibold">
                  Total investment: ₹{config.totalActivationCost.toLocaleString('en-IN')}
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
    </div>
  );
}
