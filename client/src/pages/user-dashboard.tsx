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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-20 lg:pb-8" data-testid="user-dashboard">
      {/* Header Section */}
      <DashboardHeader
        userName={user?.name}
        userEmail={user?.email}
        userId={user?.userId}
        isActivated={isActivated}
        reentryStatus={reentryStatus}
      />

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

      {/* Quick Actions - Always visible */}
      <QuickActions />

      {/* Referral Links - Only shown after activation */}
      {isActivated && (
        <DashboardReferralLinks
          leftLegLink={leftLegLink}
          rightLegLink={rightLegLink}
          copiedLeft={copiedLeft}
          copiedRight={copiedRight}
          onCopyLeft={() => copyToClipboard(leftLegLink, 'left')}
          onCopyRight={() => copyToClipboard(rightLegLink, 'right')}
        />
      )}

      {/* Dashboard Widgets Grid */}
      {isActivated && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ProgressWidget 
            currentCycle={reentryStatus?.currentCycleNumber}
            isActivated={isActivated}
            matrixComplete={reentryStatus?.isMatrixComplete}
          />
          <TeamStats 
            totalReferrals={directReferrals?.length || 0}
            leftLeg={user?.leftLegCount || 0}
            rightLeg={user?.rightLegCount || 0}
          />
          <EarningsOverview
            totalEarnings={totalEarnings}
            sponsorIncome={sponsorIncome}
            binaryIncome={binaryIncome}
            matrixIncome={matrixIncome}
          />
        </div>
      )}

      {/* Tree Previews */}
      {isActivated && (
        <DashboardTreePreviews binaryTree={binaryTree} matrixTree={matrixTree} />
      )}

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
  );
}
