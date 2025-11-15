import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Archive } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useSystemConfig, formatINR } from '@/hooks/use-system-config';
import type { ActivationPayment } from '@shared/schema';

interface EnrichedPayment extends ActivationPayment {
  receiverName?: string;
  receiverEmail?: string;
  receiverMobile?: string;
  receiverUpiId?: string;
}

interface CycleData {
  cycleNumber: number;
  activationId: string;
  activationStatus: string;
  completedAt: Date | null;
  payments: EnrichedPayment[];
}

export default function PaymentArchivePage() {
  const { user } = useAuth();
  const { config } = useSystemConfig();
  const [expandedCycles, setExpandedCycles] = useState<Set<number>>(new Set([1]));
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set());

  const payerIdentifier = user?.userId ?? user?.id;
  const { data: cycles, isLoading, refetch } = useQuery<CycleData[]>({
    queryKey: ['/api/activation-payments/archive', payerIdentifier],
    enabled: !!user && !!payerIdentifier,
  });

  const toggleCycleExpansion = (cycleNumber: number) => {
    setExpandedCycles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cycleNumber)) {
        newSet.delete(cycleNumber);
      } else {
        newSet.add(cycleNumber);
      }
      return newSet;
    });
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
        const isPhase1 = slotIndex !== undefined && slotIndex < 3;
        return <Badge variant="default" className={isPhase1 ? "bg-yellow-500" : "bg-green-600"}>Confirmed</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Paid</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getCycleStats = (payments: EnrichedPayment[]) => {
    const confirmed = payments.filter(p => p.status === 'confirmed').length;
    const submitted = payments.filter(p => p.status === 'submitted').length;
    const rejected = payments.filter(p => p.status === 'rejected').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const totalPaid = payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + Number(p.amountInr || 0), 0);
    
    return { confirmed, submitted, rejected, pending, totalPaid };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!cycles || cycles.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Payment Archive</h1>
          <p className="text-muted-foreground">View all your past activation cycles and payments</p>
        </div>

        <Alert>
          <Archive className="h-4 w-4" />
          <AlertDescription>
            No payment history found. Complete your first activation to see payment records here.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Payment Archive</h1>
          <p className="text-muted-foreground">
            View all your activation cycles and payment history
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="default"
          data-testid="button-refresh-archive"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {cycles.map((cycle) => {
          const isCycleExpanded = expandedCycles.has(cycle.cycleNumber);
          const stats = getCycleStats(cycle.payments);
          const isCompleted = cycle.activationStatus === 'completed';

          return (
            <Card key={cycle.cycleNumber} className="border-2">
              <CardHeader className="cursor-pointer" onClick={() => toggleCycleExpansion(cycle.cycleNumber)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">
                        Cycle {cycle.cycleNumber}
                        {cycle.cycleNumber === 1 && <span className="text-sm font-normal text-muted-foreground ml-2">(First Activation)</span>}
                      </CardTitle>
                      {isCompleted && (
                        <Badge variant="default" className="bg-green-600">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {cycle.payments.length === 0 ? (
                        <span className="text-yellow-600 font-medium">Cycle not yet started - No payments created</span>
                      ) : cycle.activationStatus === 'pending' ? (
                        <span className="text-yellow-600 font-medium">
                          Cycle in progress - {stats.confirmed}/8 payments confirmed
                        </span>
                      ) : stats.confirmed === 8 ? (
                        <span className="text-green-600 font-medium">All 8 payments confirmed</span>
                      ) : (
                        <span>
                          {stats.confirmed}/8 confirmed
                          {stats.submitted > 0 && ` • ${stats.submitted} pending review`}
                          {stats.rejected > 0 && ` • ${stats.rejected} rejected`}
                          {stats.pending > 0 && ` • ${stats.pending} not paid`}
                        </span>
                      )}
                      {cycle.completedAt && (
                        <span className="text-muted-foreground ml-2">
                          • Completed on {formatDate(cycle.completedAt)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-2xl font-bold">{formatINR(stats.totalPaid)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCycleExpansion(cycle.cycleNumber);
                      }}
                      data-testid={`button-toggle-cycle-${cycle.cycleNumber}`}
                    >
                      {isCycleExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isCycleExpanded && (
                <CardContent className="space-y-3">
                  {cycle.payments.length === 0 ? (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        This cycle has not been started yet. No activation payments have been created.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      {cycle.payments.map((payment) => {
                        const isPaymentExpanded = expandedPayments.has(payment.id);
                        return (
                          <div
                            key={payment.id}
                            className="border rounded-lg"
                            data-testid={`payment-slot-${cycle.cycleNumber}-${payment.slotIndex}`}
                          >
                            <div className="flex items-center justify-between p-4 hover-elevate cursor-pointer" onClick={() => togglePaymentDetails(payment.id)}>
                              <div className="flex items-center gap-3">
                                {getStatusIcon(payment.status)}
                                <div>
                                  <p className="font-medium">{getPaymentSlotLabel(payment.slotIndex)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {payment.receiverType === 'admin' 
                                      ? 'Admin Account (PB0)' 
                                      : payment.receiverName 
                                        ? `${payment.receiverName} (${payment.receiverUserId})` 
                                        : payment.receiverUserId || 'Not assigned'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="font-bold">{formatINR(Number(payment.amountInr))}</p>
                                  {getStatusBadge(payment.status, payment.slotIndex)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePaymentDetails(payment.id);
                                  }}
                                  data-testid={`button-toggle-payment-${cycle.cycleNumber}-${payment.slotIndex}`}
                                >
                                  {isPaymentExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>

                            {/* Expandable Payment Details */}
                            {isPaymentExpanded && (payment.status === 'submitted' || payment.status === 'confirmed' || payment.status === 'rejected') && (
                              <div className="border-t bg-muted/30 p-4 space-y-4">
                                <h4 className="font-semibold text-sm">Payment Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  {/* Payment Information */}
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-muted-foreground">Payment To:</span>
                                      {payment.receiverType === 'admin' ? (
                                        <p className="font-medium">Admin Account (PB0)</p>
                                      ) : payment.receiverName ? (
                                        <div>
                                          <p className="font-medium">{payment.receiverName}</p>
                                          <p className="text-xs text-muted-foreground">{payment.receiverUserId}</p>
                                          {payment.receiverMobile && (
                                            <p className="text-xs text-muted-foreground">Mobile: {payment.receiverMobile}</p>
                                          )}
                                          {payment.receiverUpiId && (
                                            <p className="text-xs text-muted-foreground">UPI: {payment.receiverUpiId}</p>
                                          )}
                                          {payment.receiverEmail && (
                                            <p className="text-xs text-muted-foreground">Email: {payment.receiverEmail}</p>
                                          )}
                                        </div>
                                      ) : (
                                        <p className="font-medium">{payment.receiverUserId || 'Not assigned'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Amount:</span>
                                      <p className="font-medium">{formatINR(Number(payment.amountInr))}</p>
                                    </div>
                                    {payment.offlineUtrId && (
                                      <div>
                                        <span className="text-muted-foreground">UTR/Transaction ID:</span>
                                        <p className="font-mono text-xs font-medium">{payment.offlineUtrId}</p>
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
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
