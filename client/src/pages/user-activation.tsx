import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Circle, Clock, Info, AlertCircle, RefreshCw, Copy, CheckCircle2, UserCheck, ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { PaymentSubmissionDialog } from '@/components/payment-submission-dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ActivationPayment } from '@shared/schema';
import { useSystemConfig, formatINR, getPaymentAmount } from '@/hooks/use-system-config';

interface AdminPaymentDetails {
  userId: string;
  name: string | null;
  mobile: string | null;
  upiId: string | null;
  bankAccountHolder: string | null;
  bankAccount: string | null;
  ifscCode: string | null;
  paymentQrUrl: string | null;
}

interface EnrichedPayment extends ActivationPayment {
  receiverName?: string | null;
  receiverEmail?: string | null;
  receiverMobile?: string | null;
  receiverUpiId?: string | null;
  receiverBankAccountHolder?: string | null;
  receiverBankAccount?: string | null;
  receiverIfscCode?: string | null;
}

interface CycleData {
  cycleNumber: number;
  activationId: string;
  status: 'pending' | 'active' | 'completed';
  payments: EnrichedPayment[];
  confirmedCount: number;
  totalAmount: number;
  confirmedAmount: number;
  createdAt?: Date | string;
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

export default function UserActivationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { config, isLoading: configLoading } = useSystemConfig();
  const [selectedPayment, setSelectedPayment] = useState<ActivationPayment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>('');

  // Fetch user's activation payments
  // Use userId (PB####) if available, otherwise use database UUID for pre-activation users
  const payerIdentifier = user?.userId ?? user?.id;
  const { data: payments, isLoading, refetch } = useQuery<EnrichedPayment[]>({
    queryKey: ['/api/activation-payments/payer', payerIdentifier],
    enabled: !!user && !!payerIdentifier,
  });

  // Fetch admin payment details
  const { data: adminPaymentDetails } = useQuery<AdminPaymentDetails>({
    queryKey: ['/api/admin/payment-details'],
    enabled: !!user,
  });

  // Fetch sponsor details if user has a sponsor
  const { data: sponsorData } = useQuery<{ userId: string; name: string | null }>({
    queryKey: ['/api/users', user?.sponsorId, 'public'],
    enabled: !!user?.sponsorId,
  });

  // Fetch re-entry history to map activations to cycles
  const { data: reentryHistory = [] } = useQuery<ReentryHistory[]>({
    queryKey: ['/api/reentry/history'],
    enabled: !!user,
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: 'Copied',
      description: `${fieldName} copied to clipboard`,
    });
  };

  // Mutation to request activation
  const requestActivationMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/activations/request', {}),
    onSuccess: () => {
      toast({
        title: 'Activation Requested',
        description: 'Your payment slots have been created. Start making payments!',
      });
      // Invalidate with the same identifier pattern used in the query
      queryClient.invalidateQueries({ queryKey: ['/api/activation-payments/payer', payerIdentifier] });
      refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to request activation';
      
      // Check if this is a profile incomplete error
      // Only redirect if error specifically mentions "incomplete" or "complete your profile"
      const isProfileIncomplete = 
        errorMessage.toLowerCase().includes('profile incomplete') ||
        errorMessage.toLowerCase().includes('complete your profile') ||
        (errorMessage.toLowerCase().includes('profile') && errorMessage.toLowerCase().includes('before'));
      
      if (isProfileIncomplete) {
        toast({
          title: 'Profile Incomplete',
          description: 'Redirecting you to complete your profile...',
          variant: 'destructive',
        });
        // Redirect to profile page after a short delay
        setTimeout(() => {
          setLocation('/user/profile');
        }, 1500);
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  const getPaymentSlotLabel = (slotIndex: number): string => {
    const labels = [
      'Direct Sponsor',
      'Binary Match',
      'Top Reward Payment',
      'Matrix Level 1',
      'Matrix Level 2',
      'Matrix Level 3',
      'Matrix Level 4',
      'Matrix Level 5',
    ];
    return labels[slotIndex] || `Payment ${slotIndex + 1}`;
  };

  const getStatusBadge = (status: string, slotIndex?: number) => {
    switch (status) {
      case 'confirmed':
        // Phase 1 (first 3 payments: slots 0-2) use YELLOW badge
        // Phase 2 (matrix payments: slots 3-7) use GREEN badge
        const isPhase1 = slotIndex !== undefined && slotIndex < 3;
        return <Badge variant="default" className={isPhase1 ? "bg-yellow-500" : "bg-green-600"}>Confirmed</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'awaiting_assignment':
        return <Badge variant="outline" className="text-yellow-600">Awaiting Assignment</Badge>;
      default:
        return <Badge variant="outline">Not Paid</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'submitted':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Group payments by cycle
  const groupPaymentsByCycle = (): CycleData[] => {
    if (!payments || payments.length === 0) return [];

    // Group payments by activationId
    const paymentsByActivation = payments.reduce((acc, payment) => {
      if (!acc[payment.activationId]) {
        acc[payment.activationId] = [];
      }
      acc[payment.activationId].push(payment);
      return acc;
    }, {} as Record<string, EnrichedPayment[]>);

    // Map each activation to a cycle
    const cycles: CycleData[] = [];
    
    // Find Cycle 1 (first activation, not linked to any re-entry)
    const cycle1ActivationIds = Object.keys(paymentsByActivation).filter(actId => {
      // Cycle 1 activation is NOT in any re-entry's newActivationId
      return !reentryHistory.some(re => re.newActivationId === actId);
    });

    if (cycle1ActivationIds.length > 0) {
      const activationId = cycle1ActivationIds[0]; // Should only be one
      const cyclePayments = paymentsByActivation[activationId];
      cycles.push({
        cycleNumber: 1,
        activationId,
        status: cyclePayments.every(p => p.status === 'confirmed') ? 'completed' : 'active',
        payments: cyclePayments,
        confirmedCount: cyclePayments.filter(p => p.status === 'confirmed').length,
        totalAmount: config.totalActivationCost,
        confirmedAmount: cyclePayments
          .filter(p => p.status === 'confirmed')
          .reduce((sum, p) => sum + Number(p.amountInr || 0), 0),
      });
    }

    // Add re-entry cycles
    // CRITICAL: re.cycleNumber is the COMPLETED cycle, so new activation is cycleNumber + 1
    reentryHistory
      .filter(re => re.newActivationId && paymentsByActivation[re.newActivationId])
      .forEach(re => {
        const cyclePayments = paymentsByActivation[re.newActivationId!];
        cycles.push({
          cycleNumber: re.cycleNumber + 1, // Show as NEXT cycle (completed cycle + 1)
          activationId: re.newActivationId!,
          status: cyclePayments.every(p => p.status === 'confirmed') ? 'completed' : 'active',
          payments: cyclePayments,
          confirmedCount: cyclePayments.filter(p => p.status === 'confirmed').length,
          totalAmount: config.totalActivationCost,
          confirmedAmount: cyclePayments
            .filter(p => p.status === 'confirmed')
            .reduce((sum, p) => sum + Number(p.amountInr || 0), 0),
        });
      });

    // Sort by cycle number
    return cycles.sort((a, b) => a.cycleNumber - b.cycleNumber);
  };

  const cycles = groupPaymentsByCycle();
  
  // Compute the default active cycle (highest/current cycle)
  const defaultActiveCycle = cycles.length > 0 
    ? (cycles.find(c => c.status === 'active') || cycles[cycles.length - 1])
    : null;
  const defaultCycleId = defaultActiveCycle ? `cycle-${defaultActiveCycle.cycleNumber}` : '';
  
  // Set active tab to the highest/current cycle by default (only once when data loads)
  React.useEffect(() => {
    if (cycles.length > 0 && !activeTab) {
      setActiveTab(defaultCycleId);
    }
  }, [cycles.length, activeTab, defaultCycleId]);
  
  // Use activeTab or default to the current cycle
  const effectiveTab = activeTab || defaultCycleId;
  const currentCycle = cycles.find(c => c.cycleNumber === Number(effectiveTab.split('-')[1])) || cycles[0];
  // CRITICAL: Only show payments for the current cycle, NOT all payments as fallback
  const cyclePayments = currentCycle?.payments || [];

  const confirmedCount = cyclePayments?.filter(p => p.status === 'confirmed').length || 0;
  const submittedCount = cyclePayments?.filter(p => p.status === 'submitted').length || 0;
  const rejectedCount = cyclePayments?.filter(p => p.status === 'rejected').length || 0;
  
  // Check if first 3 payments (slots 0-2) are all confirmed
  const firstThreeConfirmed = cyclePayments
    ? cyclePayments.filter(p => p.slotIndex < 3).every(p => p.status === 'confirmed')
    : false;
  
  // Sum actual amounts from confirmed payments
  const confirmedAmount = cyclePayments
    ?.filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + Number(p.amountInr || 0), 0) || 0;
  
  const totalAmount = config.totalActivationCost;

  const handlePayClick = (payment: ActivationPayment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const togglePaymentDetails = (paymentId: string) => {
    setExpandedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const hasPayments = payments && payments.length > 0;

  if (isLoading || configLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Show request activation button if no payments exist
  if (!hasPayments) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Account Activation</h1>
          <p className="text-muted-foreground">
            Activate your account to start earning
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ready to Activate?</CardTitle>
            <CardDescription>
              Complete the {formatINR(config.totalActivationCost)} activation fee through 8 peer-to-peer payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Activation Breakdown:</p>
              <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                <li>• Direct Sponsor: {formatINR(config.sponsorPaymentAmount)}</li>
                <li>• Binary Match: {formatINR(config.binaryMatchPaymentAmount)}</li>
                <li>• Top Reward: {formatINR(config.topRewardAmount)}</li>
                <li>• Matrix Levels 1-5: {formatINR(config.matrixLevel1Amount)} each ({formatINR(config.matrixLevel1Amount * 5)} total)</li>
              </ul>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Once you click "Request Activation", 8 payment slots will be created. 
                You'll make direct payments to your sponsor and other members using Google Pay, Paytm, or PhonePe.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => requestActivationMutation.mutate()}
              disabled={requestActivationMutation.isPending}
              size="lg"
              className="w-full"
              data-testid="button-request-activation"
            >
              {requestActivationMutation.isPending ? 'Processing...' : 'Request Activation'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Account Activation</h1>
          <p className="text-muted-foreground">
            Complete 8 payments to activate your account and start earning
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="default"
          data-testid="button-refresh-activation"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Cycle Tabs - Organized Payment Lists */}
      {cycles.length > 0 && (
        <Tabs value={effectiveTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full mb-4" style={{ gridTemplateColumns: `repeat(${cycles.length}, 1fr)` }}>
            {cycles.map((cycle) => {
              const isCompleted = cycle.status === 'completed';
              const isCurrent = cycle.status === 'active';
              return (
                <TabsTrigger 
                  key={`cycle-${cycle.cycleNumber}`} 
                  value={`cycle-${cycle.cycleNumber}`}
                  data-testid={`tab-cycle-${cycle.cycleNumber}`}
                  className={`flex-col h-auto py-3 ${cycle.cycleNumber === 1 ? 'data-[state=active]:bg-green-100 dark:data-[state=active]:bg-green-900/30 data-[state=active]:text-green-800 dark:data-[state=active]:text-green-300' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Cycle {cycle.cycleNumber}</span>
                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {isCurrent && <Clock className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={isCompleted ? "default" : "outline"} className={isCompleted ? "bg-green-600" : ""}>
                      {cycle.confirmedCount}/8 Paid
                    </Badge>
                    {isCompleted && <span className="text-xs text-muted-foreground">Completed</span>}
                    {isCurrent && <span className="text-xs text-blue-600">Active</span>}
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {cycles.length > 1 && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Each cycle represents a separate activation. Switch between tabs to view payment details for each cycle.
              </AlertDescription>
            </Alert>
          )}
        </Tabs>
      )}

      {/* Payment Content Section - Shows for active cycle only */}
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Activation Fee: ₹{totalAmount.toLocaleString()}</strong>
            <br />
            Complete 8 payments to designated members below. Payment amounts vary by slot type. All payments are direct peer-to-peer transfers using Google Pay, Paytm, or PhonePe.
          </AlertDescription>
        </Alert>

      {/* Sponsor Information */}
      {user?.sponsorId && (
        <Alert className="border-accent/20 bg-accent/5" data-testid="alert-sponsor-info">
          <UserCheck className="h-4 w-4 text-accent" />
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-medium">Your Sponsor:</span>
              <span className="font-semibold text-accent" data-testid="text-sponsor-name-activation">
                {sponsorData?.name || 'Name not set'}
              </span>
              <code className="font-mono text-sm text-muted-foreground" data-testid="text-sponsor-id-activation">
                ({user.sponsorId})
              </code>
              {user.binaryLeg && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    {user.binaryLeg === 'left' ? (
                      <>
                        <ArrowLeft className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-500 font-medium">Left Leg</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500 font-medium">Right Leg</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your <strong>Direct Sponsor</strong> payment (Slot 0) will go to {user.sponsorId}
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedCount}/8</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{submittedCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Needs resubmission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{confirmedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">of ₹{totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle>Payment Checklist - Cycle {Number(effectiveTab.split('-')[1]) || 1}</CardTitle>
            <CardDescription>Complete all 8 payments for this cycle to activate</CardDescription>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            data-testid="button-refresh-payments"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 text-green-600 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!currentCycle ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This cycle hasn't started yet. Complete your current cycle first.
                </AlertDescription>
              </Alert>
            ) : cyclePayments && cyclePayments.length > 0 ? (
              <>
                {/* First 3 payments (always visible) */}
                {cyclePayments
                  .filter(p => p.slotIndex < 3)
                  .map((payment) => {
                    const isExpanded = expandedPayments.has(payment.id);
                    return (
                      <div
                        key={payment.id}
                        className="border rounded-lg"
                        data-testid={`payment-slot-${payment.slotIndex}`}
                      >
                        <div className="flex items-center justify-between p-4 hover-elevate cursor-pointer" onClick={() => togglePaymentDetails(payment.id)}>
                          <div className="flex items-center gap-3">
                            {getStatusIcon(payment.status)}
                            <div>
                              <p className="font-medium">{getPaymentSlotLabel(payment.slotIndex)}</p>
                              <p className="text-xs text-muted-foreground">
                                {payment.receiverType === 'admin' ? 'Admin Account (PB0)' : payment.receiverUserId}
                              </p>
                              {payment.status === 'submitted' && payment.offlineUtrId && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  UTR: {payment.offlineUtrId}
                                </p>
                              )}
                              {payment.status === 'rejected' && payment.rejectionReason && (
                                <p className="text-xs text-red-600 mt-1">
                                  Reason: {payment.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold">₹{payment.amountInr}</p>
                              {getStatusBadge(payment.status, payment.slotIndex)}
                              {payment.submissionCount > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Attempts: {payment.submissionCount}
                                </p>
                              )}
                            </div>
                            {(payment.status === 'pending' || payment.status === 'rejected') && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePayClick(payment);
                                }}
                                data-testid={`button-pay-${payment.slotIndex}`}
                              >
                                {payment.status === 'rejected' ? 'Resubmit' : 'Pay Now'}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePaymentDetails(payment.id);
                              }}
                              data-testid={`button-toggle-details-${payment.slotIndex}`}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Expandable Payment Details */}
                        {isExpanded && (payment.status === 'submitted' || payment.status === 'confirmed' || payment.status === 'rejected') && (
                          <div className="border-t bg-muted/30 p-4 space-y-4">
                            <h4 className="font-semibold text-sm">Payment Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {/* Payment Information */}
                              <div className="space-y-2">
                                <div>
                                  <span className="text-muted-foreground">Payment To:</span>
                                  <p className="font-medium">{payment.receiverType === 'admin' ? 'Admin Account (PB0)' : payment.receiverUserId}</p>
                                </div>
                                {/* Receiver Mobile Number */}
                                {payment.receiverType === 'admin' && adminPaymentDetails?.mobile && (
                                  <div>
                                    <span className="text-muted-foreground">Mobile:</span>
                                    <p className="font-medium">{adminPaymentDetails.mobile}</p>
                                  </div>
                                )}
                                {payment.receiverType !== 'admin' && payment.receiverMobile && (
                                  <div>
                                    <span className="text-muted-foreground">Mobile:</span>
                                    <p className="font-medium">{payment.receiverMobile}</p>
                                  </div>
                                )}
                                <div>
                                  <span className="text-muted-foreground">Amount:</span>
                                  <p className="font-medium">₹{payment.amountInr}</p>
                                </div>
                                {/* Receiver UPI ID */}
                                {payment.receiverType === 'admin' && adminPaymentDetails?.upiId && (
                                  <div>
                                    <span className="text-muted-foreground">UPI ID:</span>
                                    <p className="font-mono text-xs font-medium">{adminPaymentDetails.upiId}</p>
                                  </div>
                                )}
                                {payment.receiverType !== 'admin' && payment.receiverUpiId && (
                                  <div>
                                    <span className="text-muted-foreground">UPI ID:</span>
                                    <p className="font-mono text-xs font-medium">{payment.receiverUpiId}</p>
                                  </div>
                                )}
                                {/* Receiver Bank Account */}
                                {payment.receiverType === 'admin' && adminPaymentDetails?.bankAccount && (
                                  <div>
                                    <span className="text-muted-foreground">Bank Account:</span>
                                    <p className="font-mono text-xs font-medium">
                                      {adminPaymentDetails.bankAccount}
                                      {adminPaymentDetails.ifscCode && ` (IFSC: ${adminPaymentDetails.ifscCode})`}
                                    </p>
                                    {adminPaymentDetails.bankAccountHolder && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        A/c Holder: {adminPaymentDetails.bankAccountHolder}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {payment.receiverType !== 'admin' && payment.receiverBankAccount && (
                                  <div>
                                    <span className="text-muted-foreground">Bank Account:</span>
                                    <p className="font-mono text-xs font-medium">
                                      {payment.receiverBankAccount}
                                      {payment.receiverIfscCode && ` (IFSC: ${payment.receiverIfscCode})`}
                                    </p>
                                    {payment.receiverBankAccountHolder && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        A/c Holder: {payment.receiverBankAccountHolder}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {payment.offlineUtrId && (
                                  <div>
                                    <span className="text-muted-foreground">UTR/Transaction ID:</span>
                                    <p className="font-mono text-xs font-bold">{payment.offlineUtrId}</p>
                                  </div>
                                )}
                                {payment.submissionCount > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Submission Count:</span>
                                    <p className="font-medium">{payment.submissionCount}</p>
                                  </div>
                                )}
                              </div>

                              {/* Timeline */}
                              <div className="space-y-2">
                                <div>
                                  <span className="text-muted-foreground">Created:</span>
                                  <p className="text-xs">{formatDate(payment.createdAt)}</p>
                                </div>
                                {payment.paymentSubmittedAt && (
                                  <div>
                                    <span className="text-muted-foreground">Payment Submitted:</span>
                                    <p className="text-xs text-blue-600 font-medium">{formatDate(payment.paymentSubmittedAt)}</p>
                                  </div>
                                )}
                                {payment.confirmedAt && (
                                  <div>
                                    <span className="text-muted-foreground">Confirmed:</span>
                                    <p className="text-xs text-green-600 font-medium">{formatDate(payment.confirmedAt)}</p>
                                  </div>
                                )}
                                {payment.rejectedAt && (
                                  <div>
                                    <span className="text-muted-foreground">Rejected:</span>
                                    <p className="text-xs text-red-600 font-medium">{formatDate(payment.rejectedAt)}</p>
                                  </div>
                                )}
                                {payment.updatedAt && (
                                  <div>
                                    <span className="text-muted-foreground">Last Updated:</span>
                                    <p className="text-xs">{formatDate(payment.updatedAt)}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Additional Information */}
                            {(payment.rejectionReason || payment.notes || payment.offlineProofUrl) && (
                              <div className="space-y-2 pt-2 border-t">
                                {payment.rejectionReason && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Rejection Reason:</span>
                                    <p className="text-sm text-red-600 mt-1">{payment.rejectionReason}</p>
                                  </div>
                                )}
                                {payment.notes && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Notes:</span>
                                    <p className="text-sm mt-1">{payment.notes}</p>
                                  </div>
                                )}
                                {payment.offlineProofUrl && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Payment Proof:</span>
                                    <a 
                                      href={payment.offlineProofUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline block mt-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      View Proof
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                
                {/* Matrix payments notice (shown when first 3 not all confirmed) */}
                {!firstThreeConfirmed && (
                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900 dark:text-blue-100">
                      <strong>Matrix Payments (5 remaining)</strong>
                      <br />
                      Matrix payment slots will appear after your first 3 payments are confirmed. 
                      Complete and get confirmation for Direct Sponsor, Binary Match, and Top Reward Payment first.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Matrix payments (slots 3-7, shown only after first 3 confirmed) */}
                {firstThreeConfirmed && cyclePayments
                  .filter(p => p.slotIndex >= 3)
                  .map((payment) => {
                    const isExpanded = expandedPayments.has(payment.id);
                    return (
                      <div
                        key={payment.id}
                        className="border rounded-lg"
                        data-testid={`payment-slot-${payment.slotIndex}`}
                      >
                        <div className="flex items-center justify-between p-4 hover-elevate cursor-pointer" onClick={() => togglePaymentDetails(payment.id)}>
                          <div className="flex items-center gap-3">
                            {getStatusIcon(payment.status)}
                            <div>
                              <p className="font-medium">{getPaymentSlotLabel(payment.slotIndex)}</p>
                              <p className="text-xs text-muted-foreground">
                                {payment.receiverType === 'admin' ? 'Admin Account (PB0)' : payment.receiverUserId || 'Assigning...'}
                              </p>
                              {payment.status === 'submitted' && payment.offlineUtrId && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  UTR: {payment.offlineUtrId}
                                </p>
                              )}
                              {payment.status === 'rejected' && payment.rejectionReason && (
                                <p className="text-xs text-red-600 mt-1">
                                  Reason: {payment.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold">₹{payment.amountInr}</p>
                              {getStatusBadge(payment.status, payment.slotIndex)}
                              {payment.submissionCount > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Attempts: {payment.submissionCount}
                                </p>
                              )}
                            </div>
                            {(payment.status === 'pending' || payment.status === 'rejected') && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePayClick(payment);
                                }}
                                data-testid={`button-pay-${payment.slotIndex}`}
                              >
                                {payment.status === 'rejected' ? 'Resubmit' : 'Pay Now'}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePaymentDetails(payment.id);
                              }}
                              data-testid={`button-toggle-details-${payment.slotIndex}`}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Expandable Payment Details */}
                        {isExpanded && (payment.status === 'submitted' || payment.status === 'confirmed' || payment.status === 'rejected') && (
                          <div className="border-t bg-muted/30 p-4 space-y-4">
                            <h4 className="font-semibold text-sm">Payment Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {/* Payment Information */}
                              <div className="space-y-2">
                                <div>
                                  <span className="text-muted-foreground">Payment To:</span>
                                  <p className="font-medium">{payment.receiverType === 'admin' ? 'Admin Account (PB0)' : payment.receiverUserId || 'Assigning...'}</p>
                                </div>
                                {/* Receiver Mobile Number */}
                                {payment.receiverType === 'admin' && adminPaymentDetails?.mobile && (
                                  <div>
                                    <span className="text-muted-foreground">Mobile:</span>
                                    <p className="font-medium">{adminPaymentDetails.mobile}</p>
                                  </div>
                                )}
                                {payment.receiverType !== 'admin' && payment.receiverMobile && (
                                  <div>
                                    <span className="text-muted-foreground">Mobile:</span>
                                    <p className="font-medium">{payment.receiverMobile}</p>
                                  </div>
                                )}
                                <div>
                                  <span className="text-muted-foreground">Amount:</span>
                                  <p className="font-medium">₹{payment.amountInr}</p>
                                </div>
                                {/* Receiver UPI ID */}
                                {payment.receiverType === 'admin' && adminPaymentDetails?.upiId && (
                                  <div>
                                    <span className="text-muted-foreground">UPI ID:</span>
                                    <p className="font-mono text-xs font-medium">{adminPaymentDetails.upiId}</p>
                                  </div>
                                )}
                                {payment.receiverType !== 'admin' && payment.receiverUpiId && (
                                  <div>
                                    <span className="text-muted-foreground">UPI ID:</span>
                                    <p className="font-mono text-xs font-medium">{payment.receiverUpiId}</p>
                                  </div>
                                )}
                                {/* Receiver Bank Account */}
                                {payment.receiverType === 'admin' && adminPaymentDetails?.bankAccount && (
                                  <div>
                                    <span className="text-muted-foreground">Bank Account:</span>
                                    <p className="font-mono text-xs font-medium">
                                      {adminPaymentDetails.bankAccount}
                                      {adminPaymentDetails.ifscCode && ` (IFSC: ${adminPaymentDetails.ifscCode})`}
                                    </p>
                                    {adminPaymentDetails.bankAccountHolder && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        A/c Holder: {adminPaymentDetails.bankAccountHolder}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {payment.receiverType !== 'admin' && payment.receiverBankAccount && (
                                  <div>
                                    <span className="text-muted-foreground">Bank Account:</span>
                                    <p className="font-mono text-xs font-medium">
                                      {payment.receiverBankAccount}
                                      {payment.receiverIfscCode && ` (IFSC: ${payment.receiverIfscCode})`}
                                    </p>
                                    {payment.receiverBankAccountHolder && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        A/c Holder: {payment.receiverBankAccountHolder}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {payment.offlineUtrId && (
                                  <div>
                                    <span className="text-muted-foreground">UTR/Transaction ID:</span>
                                    <p className="font-mono text-xs font-bold">{payment.offlineUtrId}</p>
                                  </div>
                                )}
                                {payment.submissionCount > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Submission Count:</span>
                                    <p className="font-medium">{payment.submissionCount}</p>
                                  </div>
                                )}
                              </div>

                              {/* Timeline */}
                              <div className="space-y-2">
                                <div>
                                  <span className="text-muted-foreground">Created:</span>
                                  <p className="text-xs">{formatDate(payment.createdAt)}</p>
                                </div>
                                {payment.paymentSubmittedAt && (
                                  <div>
                                    <span className="text-muted-foreground">Payment Submitted:</span>
                                    <p className="text-xs text-blue-600 font-medium">{formatDate(payment.paymentSubmittedAt)}</p>
                                  </div>
                                )}
                                {payment.confirmedAt && (
                                  <div>
                                    <span className="text-muted-foreground">Confirmed:</span>
                                    <p className="text-xs text-green-600 font-medium">{formatDate(payment.confirmedAt)}</p>
                                  </div>
                                )}
                                {payment.rejectedAt && (
                                  <div>
                                    <span className="text-muted-foreground">Rejected:</span>
                                    <p className="text-xs text-red-600 font-medium">{formatDate(payment.rejectedAt)}</p>
                                  </div>
                                )}
                                {payment.updatedAt && (
                                  <div>
                                    <span className="text-muted-foreground">Last Updated:</span>
                                    <p className="text-xs">{formatDate(payment.updatedAt)}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Additional Information */}
                            {(payment.rejectionReason || payment.notes || payment.offlineProofUrl) && (
                              <div className="space-y-2 pt-2 border-t">
                                {payment.rejectionReason && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Rejection Reason:</span>
                                    <p className="text-sm text-red-600 mt-1">{payment.rejectionReason}</p>
                                  </div>
                                )}
                                {payment.notes && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Notes:</span>
                                    <p className="text-sm mt-1">{payment.notes}</p>
                                  </div>
                                )}
                                {payment.offlineProofUrl && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Payment Proof:</span>
                                    <a 
                                      href={payment.offlineProofUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline block mt-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      View Proof
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payment slots found. Contact admin.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. Click "Pay Now"</h4>
            <p className="text-muted-foreground">Select a payment slot to begin the payment process</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Make Payment</h4>
            <p className="text-muted-foreground">Transfer the slot payment amount to the receiver's UPI ID or bank account via Google Pay, Paytm, or PhonePe</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Submit Proof</h4>
            <p className="text-muted-foreground">Enter your UTR/Transaction ID and optionally upload payment screenshot</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Wait for Confirmation</h4>
            <p className="text-muted-foreground">The receiver will verify and confirm your payment. If rejected, you can resubmit unlimited times.</p>
          </div>
        </CardContent>
      </Card>
      </div>

      {selectedPayment && (
        <PaymentSubmissionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          payment={selectedPayment}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
