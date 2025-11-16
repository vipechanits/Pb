import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Grid3x3, RefreshCw, Trophy, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { ReentryHistory } from './ReentryHistory';

interface ReentryStatus {
  currentReentry: {
    id: string;
    userId: string;
    cycleNumber: number;
    status: string;
    initiatedAt: string | null;
    completedAt: string | null;
    activationId: string | null;
  } | null;
  isMatrixComplete: boolean;
  isEligibleForReentry: boolean;
}

interface ReentryCycle {
  id: string;
  userId: string;
  cycleNumber: number;
  status: string;
  completedAt?: string | null;
  initiatedAt?: string | null;
  activationId?: string | null;
}

interface DashboardReentryProps {
  reentryStatus: ReentryStatus | undefined;
  reentryStatusLoading: boolean;
  reentryHistory: ReentryCycle[] | undefined;
  onInitiateReentry: () => void;
  initiateReentryPending: boolean;
}

export function DashboardReentry({
  reentryStatus,
  reentryStatusLoading,
  reentryHistory,
  onInitiateReentry,
  initiateReentryPending,
}: DashboardReentryProps) {
  return (
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
              onClick={onInitiateReentry}
              className="w-full bg-amber-600 hover:bg-amber-700"
              data-testid="button-initiate-reentry"
              disabled={initiateReentryPending}
            >
              {initiateReentryPending ? (
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
        {reentryHistory && <ReentryHistory reentryHistory={reentryHistory} />}
      </CardContent>
    </Card>
  );
}
