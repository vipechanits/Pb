import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Circle, Clock, Info, AlertCircle, RefreshCw, Copy, CheckCircle2, UserCheck, ArrowLeft, ArrowRight } from 'lucide-react';
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

export default function UserActivationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { config, isLoading: configLoading } = useSystemConfig();
  const [selectedPayment, setSelectedPayment] = useState<ActivationPayment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch user's activation payments
  // Use userId (PB####) if available, otherwise use database UUID for pre-activation users
  const payerIdentifier = user?.userId ?? user?.id;
  const { data: payments, isLoading, refetch } = useQuery<ActivationPayment[]>({
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
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-600">Confirmed</Badge>;
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

  const confirmedCount = payments?.filter(p => p.status === 'confirmed').length || 0;
  const submittedCount = payments?.filter(p => p.status === 'submitted').length || 0;
  const rejectedCount = payments?.filter(p => p.status === 'rejected').length || 0;
  
  // Check if first 3 payments (slots 0-2) are all confirmed
  const firstThreeConfirmed = payments
    ? payments.filter(p => p.slotIndex < 3).every(p => p.status === 'confirmed')
    : false;
  
  // Sum actual amounts from confirmed payments
  const confirmedAmount = payments
    ?.filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + Number(p.amountInr || 0), 0) || 0;
  
  const totalAmount = config.totalActivationCost;

  const handlePayClick = (payment: ActivationPayment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
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

      {/* Admin Payment Details Card */}
      {adminPaymentDetails && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Admin Payment Details (PB0)
            </CardTitle>
            <CardDescription>
              Use these details for all admin payments (Top Reward & Matrix Levels)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Payment Details */}
              <div className="space-y-4">
                {adminPaymentDetails.upiId && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">UPI ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-semibold" data-testid="text-admin-upi">{adminPaymentDetails.upiId}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(adminPaymentDetails.upiId!, 'UPI ID')}
                        data-testid="button-copy-admin-upi"
                      >
                        {copiedField === 'UPI ID' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {adminPaymentDetails.bankAccount && (
                  <>
                    {adminPaymentDetails.bankAccountHolder && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Account Holder</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-semibold" data-testid="text-admin-account-holder">{adminPaymentDetails.bankAccountHolder}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(adminPaymentDetails.bankAccountHolder!, 'Account Holder')}
                            data-testid="button-copy-admin-account-holder"
                          >
                            {copiedField === 'Account Holder' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Bank Account</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-semibold" data-testid="text-admin-bank">{adminPaymentDetails.bankAccount}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(adminPaymentDetails.bankAccount!, 'Bank Account')}
                          data-testid="button-copy-admin-bank"
                        >
                          {copiedField === 'Bank Account' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {adminPaymentDetails.ifscCode && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">IFSC Code</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-semibold" data-testid="text-admin-ifsc">{adminPaymentDetails.ifscCode}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(adminPaymentDetails.ifscCode!, 'IFSC Code')}
                            data-testid="button-copy-admin-ifsc"
                          >
                            {copiedField === 'IFSC Code' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {adminPaymentDetails.mobile && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-semibold" data-testid="text-admin-mobile">{adminPaymentDetails.mobile}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(adminPaymentDetails.mobile!, 'Mobile')}
                        data-testid="button-copy-admin-mobile"
                      >
                        {copiedField === 'Mobile' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code */}
              {adminPaymentDetails.paymentQrUrl && (
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Scan to Pay</p>
                  <div className="border-2 rounded-lg p-3 bg-white">
                    <img 
                      src={adminPaymentDetails.paymentQrUrl} 
                      alt="Admin UPI QR Code" 
                      className="w-48 h-48 object-contain"
                      data-testid="img-admin-qr"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
        <CardHeader>
          <CardTitle>Payment Checklist</CardTitle>
          <CardDescription>Complete all 8 payments to activate your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments && payments.length > 0 ? (
              <>
                {/* First 3 payments (always visible) */}
                {payments
                  .filter(p => p.slotIndex < 3)
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`payment-slot-${payment.slotIndex}`}
                    >
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
                          {getStatusBadge(payment.status)}
                          {payment.submissionCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Attempts: {payment.submissionCount}
                            </p>
                          )}
                        </div>
                        {(payment.status === 'pending' || payment.status === 'rejected') && (
                          <Button
                            size="sm"
                            onClick={() => handlePayClick(payment)}
                            data-testid={`button-pay-${payment.slotIndex}`}
                          >
                            {payment.status === 'rejected' ? 'Resubmit' : 'Pay Now'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                
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
                {firstThreeConfirmed && payments
                  .filter(p => p.slotIndex >= 3)
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`payment-slot-${payment.slotIndex}`}
                    >
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
                          {getStatusBadge(payment.status)}
                          {payment.submissionCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Attempts: {payment.submissionCount}
                            </p>
                          )}
                        </div>
                        {(payment.status === 'pending' || payment.status === 'rejected') && (
                          <Button
                            size="sm"
                            onClick={() => handlePayClick(payment)}
                            data-testid={`button-pay-${payment.slotIndex}`}
                          >
                            {payment.status === 'rejected' ? 'Resubmit' : 'Pay Now'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
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
