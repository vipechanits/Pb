import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Info, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { useSystemConfig, formatINR } from '@/hooks/use-system-config';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface ReentryStatus {
  isEligibleForReentry: boolean;
  isMatrixComplete: boolean;
  currentCycleNumber: number;
  reentryCount: number;
  currentReentry: any | null;
  lastReentryAt: string | null;
}

interface ReentryHistory {
  id: string;
  cycleNumber: number;
  status: string;
  previousActivationId: string;
  newActivationId: string | null;
  totalMatrixEarnings: string;
  eligibilityDetectedAt: string;
  reentryInitiatedAt: string | null;
  reentryCompletedAt: string | null;
}

export default function ReentryPage() {
  const { config } = useSystemConfig();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Fetch re-entry status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<ReentryStatus>({
    queryKey: ['/api/reentry/status'],
  });

  // Fetch re-entry history
  const { data: history = [], isLoading: historyLoading } = useQuery<ReentryHistory[]>({
    queryKey: ['/api/reentry/history'],
  });

  // Initiate re-entry mutation
  const initiateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/reentry/initiate');
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Re-entry Initiated',
        description: data.message || `Cycle ${(status?.currentCycleNumber || 1) + 1} activation created with ${data.paymentCount || 8} payment slots.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reentry/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reentry/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activation-payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      // Redirect to activation page
      setLocation('/user/activate');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to initiate re-entry. Please try again.';
      
      // Check if this is a profile incomplete error
      // Only redirect if error specifically mentions "incomplete" or "complete your profile"
      const isProfileIncomplete = 
        errorMessage.toLowerCase().includes('profile incomplete') ||
        errorMessage.toLowerCase().includes('complete your profile') ||
        (errorMessage.toLowerCase().includes('profile') && errorMessage.toLowerCase().includes('before'));
      
      if (isProfileIncomplete) {
        toast({
          variant: 'destructive',
          title: 'Profile Incomplete',
          description: 'Redirecting you to complete your profile...',
        });
        // Redirect to profile page after a short delay
        setTimeout(() => {
          setLocation('/profile');
        }, 1500);
      } else {
        toast({
          variant: 'destructive',
          title: 'Re-entry Failed',
          description: errorMessage,
        });
      }
    },
  });

  const handleInitiateReentry = () => {
    if (!status?.isEligibleForReentry) {
      toast({
        variant: 'destructive',
        title: 'Matrix Not Complete',
        description: 'You need 62 active downline members in your matrix before you can re-enter.',
      });
      return;
    }
    
    if (!status?.isMatrixComplete) {
      toast({
        variant: 'destructive',
        title: 'Matrix Not Complete',
        description: 'Your matrix must have 62 active members before re-entry is allowed.',
      });
      return;
    }
    
    // Prevent duplicate initiations
    if (status?.currentReentry && status.currentReentry.status === 'in_progress') {
      toast({
        variant: 'destructive',
        title: 'Already In Progress',
        description: 'You already have a re-entry in progress. Please complete your current cycle payments first.',
      });
      setLocation('/user/activation');
      return;
    }
    
    initiateMutation.mutate();
  };

  const totalEarnings = history.reduce((sum, entry) => {
    return sum + parseFloat(entry.totalMatrixEarnings || '0');
  }, 0);

  const reentryStats = [
    {
      title: 'Completed Cycles',
      value: status?.reentryCount?.toString() || '0',
      description: 'Full matrix completions',
    },
    {
      title: 'Active Cycle',
      value: status ? `Cycle ${status.currentCycleNumber}` : 'Loading...',
      description: 'Current progress',
    },
    {
      title: 'Total Earnings',
      value: formatINR(totalEarnings),
      description: 'All cycles combined',
    },
    {
      title: 'Reentry Available',
      value: status?.isEligibleForReentry ? 'Yes' : 'No',
      description: 'Eligibility status',
    },
  ];

  if (statusLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Re-entry System</h1>
          <p className="text-muted-foreground">
            Compound your earnings by re-entering the matrix
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetchStatus()}
          data-testid="button-refresh-reentry"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>What is Re-entry?</AlertTitle>
        <AlertDescription>
          When you complete your matrix cycle (62 positions filled in 5 levels), you can re-enter the system 
          by paying {formatINR(config.totalActivationCost)} to start a new cycle and continue earning from matrix positions infinitely.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reentryStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
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
          <CardTitle>Re-entry Eligibility</CardTitle>
          <CardDescription>Requirements to re-enter the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              {status?.isMatrixComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div>
                <p className="font-medium">Complete Current Matrix</p>
                <p className="text-sm text-muted-foreground">
                  All 62 positions in your 5-level matrix must be filled
                  {status?.isMatrixComplete && ' ✓ Complete'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              {status?.isEligibleForReentry ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div>
                <p className="font-medium">Receive All Payments</p>
                <p className="text-sm text-muted-foreground">
                  All matrix income payments must be confirmed
                  {status?.isEligibleForReentry && ' ✓ Complete'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Account in Good Standing</p>
                <p className="text-sm text-muted-foreground">No pending disputes or compliance issues ✓</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Re-entry Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. Complete Your Cycle</h4>
            <p className="text-muted-foreground">Earn from all 62 matrix positions ({formatINR(config.totalMatrixPotential)} total income)</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Pay Re-entry Fee</h4>
            <p className="text-muted-foreground">{formatINR(config.totalActivationCost)} to start a fresh matrix cycle</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. New Cycle Begins</h4>
            <p className="text-muted-foreground">Your matrix resets and you start receiving payments from new positions</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Compound Earnings</h4>
            <p className="text-muted-foreground">
              Each cycle earns {formatINR(config.totalMatrixPotential - config.totalActivationCost)}+ profit 
              ({formatINR(config.totalMatrixPotential)} income - {formatINR(config.totalActivationCost)} re-entry)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Re-entry History</CardTitle>
          <CardDescription>Your past re-entry cycles</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No re-entry cycles yet
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Cycle {entry.cycleNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Earnings: {formatINR(parseFloat(entry.totalMatrixEarnings || '0'))}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      entry.status === 'completed' ? 'default' : 
                      entry.status === 'in_progress' ? 'secondary' : 
                      'outline'
                    }
                    data-testid={`badge-reentry-${entry.id}`}
                  >
                    {entry.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ready to Re-enter?</CardTitle>
          <CardDescription>
            {status?.currentReentry && status.currentReentry.status === 'in_progress'
              ? 'You have a re-entry in progress. Complete your payments to proceed.'
              : status?.isEligibleForReentry 
                ? 'Your matrix cycle is complete! Start a new cycle now.'
                : 'Complete your current matrix cycle to unlock re-entry'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.currentReentry && status.currentReentry.status === 'in_progress' ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Cycle {status.currentReentry.cycleNumber} re-entry is in progress. 
                Please complete your activation payments in the Activation page. The "Initiate Re-entry" button will reappear once you complete the next matrix cycle (62 users).
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Button 
                disabled={!status?.isEligibleForReentry || initiateMutation.isPending}
                onClick={handleInitiateReentry}
                className="w-full"
                data-testid="button-initiate-reentry"
              >
                {initiateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {status?.isEligibleForReentry ? 'Initiate Re-entry' : 'Re-entry Not Available'}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {status?.isEligibleForReentry 
                  ? `Re-entry fee: ${formatINR(config.totalActivationCost)} (8 payments × ₹500 each)`
                  : 'Your matrix must be complete (62 active downline members) before you can re-enter'
                }
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
