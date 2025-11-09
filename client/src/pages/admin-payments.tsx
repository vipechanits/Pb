import { CheckCircle, Clock, Shield, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useWeb3 } from '@/context/Web3Context';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

interface ActivationPaymentConfirmation {
  id: string;
  payerWalletAddress: string;
  receiverWalletAddress: string;
  receiverIndex: string;
  amountUsdt: string;
  paymentStage: string;
  isAdminReceiver: boolean;
  paymentMode: string;
  transactionId: string | null;
  transactionHash: string | null;
  paymentProofUrl: string | null;
  confirmed: boolean;
  confirmedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export default function AdminPayments() {
  const { account, isConnected } = useWeb3();
  const { toast } = useToast();

  const { data: receiverConfirmations = [], isLoading: isLoadingReceiver } = useQuery<ActivationPaymentConfirmation[]>({
    queryKey: ['activation-confirmations-receiver', account],
    enabled: isConnected && !!account,
    refetchInterval: 30000,
  });

  const { data: allConfirmations = [], isLoading: isLoadingAll } = useQuery<ActivationPaymentConfirmation[]>({
    queryKey: ['/api/activation-payments/confirmations'],
    enabled: isConnected && !!account,
    refetchInterval: 30000,
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/activation-payments/confirmations/${id}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activation-confirmations-receiver'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activation-payments/confirmations'] });
      toast({
        title: 'Payment Confirmed',
        description: 'You have confirmed receipt of the payment',
      });
    },
    onError: () => {
      toast({
        title: 'Confirmation Failed',
        description: 'Failed to confirm payment receipt',
        variant: 'destructive',
      });
    },
  });

  if (!isConnected) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please connect your wallet to view payment confirmations
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingReceiver || isLoadingAll) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const pendingConfirmations = receiverConfirmations.filter(c => !c.confirmed);
  const confirmedPayments = receiverConfirmations.filter(c => c.confirmed);
  const adminReceiverConfirmations = allConfirmations.filter(c => c.isAdminReceiver);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Confirmation Queue</h1>
        <p className="text-muted-foreground">
          Manage activation payment confirmations where you are the receiver
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingConfirmations.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your confirmation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              Successfully confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Receiver</CardTitle>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminReceiverConfirmations.length}</div>
            <p className="text-xs text-muted-foreground">
              Where admin is receiver
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pendingConfirmations.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" data-testid="tab-confirmed">
            Confirmed ({confirmedPayments.length})
          </TabsTrigger>
          <TabsTrigger value="admin-receiver" data-testid="tab-admin-receiver">
            Admin Receiver ({adminReceiverConfirmations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingConfirmations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No pending confirmations</p>
              </CardContent>
            </Card>
          ) : (
            pendingConfirmations.map((confirmation) => (
              <Card key={confirmation.id} data-testid={`confirmation-${confirmation.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        Payment from {confirmation.payerWalletAddress.slice(0, 6)}...{confirmation.payerWalletAddress.slice(-4)}
                      </CardTitle>
                      <CardDescription>
                        {confirmation.paymentStage} • Created {format(new Date(confirmation.createdAt), 'PPp')}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-lg font-semibold">{confirmation.amountUsdt} USDT</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Mode</p>
                      <p className="font-medium text-sm">{confirmation.paymentMode}</p>
                    </div>
                  </div>

                  {confirmation.transactionId && (
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction ID</p>
                      <p className="font-mono text-sm">{confirmation.transactionId}</p>
                    </div>
                  )}

                  {confirmation.paymentProofUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Payment Proof</p>
                      <a
                        href={confirmation.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View Proof
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {confirmation.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="text-sm">{confirmation.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => confirmPaymentMutation.mutate(confirmation.id)}
                      disabled={confirmPaymentMutation.isPending}
                      data-testid={`button-confirm-${confirmation.id}`}
                    >
                      {confirmPaymentMutation.isPending ? 'Confirming...' : 'Confirm Receipt'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          {confirmedPayments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No confirmed payments yet</p>
              </CardContent>
            </Card>
          ) : (
            confirmedPayments.map((confirmation) => (
              <Card key={confirmation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        Payment from {confirmation.payerWalletAddress.slice(0, 6)}...{confirmation.payerWalletAddress.slice(-4)}
                      </CardTitle>
                      <CardDescription>
                        {confirmation.paymentStage} • Confirmed {confirmation.confirmedAt && format(new Date(confirmation.confirmedAt), 'PPp')}
                      </CardDescription>
                    </div>
                    <Badge className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Confirmed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-lg font-semibold">{confirmation.amountUsdt} USDT</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Mode</p>
                      <p className="font-medium text-sm">{confirmation.paymentMode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="admin-receiver" className="space-y-4">
          {adminReceiverConfirmations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No payments where admin is the receiver</p>
              </CardContent>
            </Card>
          ) : (
            adminReceiverConfirmations.map((confirmation) => (
              <Card key={confirmation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          Payment from {confirmation.payerWalletAddress.slice(0, 6)}...{confirmation.payerWalletAddress.slice(-4)}
                        </CardTitle>
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="w-3 h-3" />
                          Admin Receiver
                        </Badge>
                      </div>
                      <CardDescription>
                        {confirmation.paymentStage} • {confirmation.confirmed ? `Confirmed ${format(new Date(confirmation.confirmedAt!), 'PPp')}` : `Created ${format(new Date(confirmation.createdAt), 'PPp')}`}
                      </CardDescription>
                    </div>
                    <Badge variant={confirmation.confirmed ? 'default' : 'outline'} className="gap-1">
                      {confirmation.confirmed ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Confirmed
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-lg font-semibold">{confirmation.amountUsdt} USDT</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Mode</p>
                      <p className="font-medium text-sm">{confirmation.paymentMode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
