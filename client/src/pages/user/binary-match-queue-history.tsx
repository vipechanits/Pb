import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle2, CircleDashed, User } from "lucide-react";
import { format } from "date-fns";

interface QueueEntry {
  id: string;
  queuePosition: number;
  enteredAt: string;
  paidAt: string | null;
  status: string;
  amountInr: string;
  paidByActivationId: string | null;
  payerUserId: string | null;
  payerName: string | null;
}

export default function BinaryMatchQueueHistory() {
  const { data: queueHistory, isLoading } = useQuery<QueueEntry[]>({
    queryKey: ["/api/user/binary-match-queue-history"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid={`badge-status-paid`}><CheckCircle2 className="w-3 h-3 mr-1" />Paid</Badge>;
      case "reserved":
        return <Badge variant="secondary" data-testid={`badge-status-reserved`}><CircleDashed className="w-3 h-3 mr-1" />Reserved</Badge>;
      case "waiting":
        return <Badge variant="outline" data-testid={`badge-status-waiting`}><Clock className="w-3 h-3 mr-1" />Waiting</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-status-unknown`}>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-queue-history">Binary Match Queue History</h1>
        <p className="text-muted-foreground" data-testid="text-description">
          Track your position in the binary match queue and payment history. Each entry represents when you qualified with a 3:3 matched pair.
        </p>
      </div>

      {!queueHistory || queueHistory.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CircleDashed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground" data-testid="text-no-queue-entries">
                No queue entries yet. Build your first 3:3 matched pair to enter the binary match queue.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {queueHistory.map((entry) => (
            <Card key={entry.id} data-testid={`card-queue-entry-${entry.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg" data-testid={`text-queue-position-${entry.id}`}>
                      Queue Position #{entry.queuePosition}
                    </CardTitle>
                    <CardDescription data-testid={`text-entered-date-${entry.id}`}>
                      Entered: {format(new Date(entry.enteredAt), "PPp")}
                    </CardDescription>
                  </div>
                  <div>
                    {getStatusBadge(entry.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount</p>
                    <p className="text-xl font-bold text-green-600" data-testid={`text-amount-${entry.id}`}>
                      ₹{parseFloat(entry.amountInr).toFixed(2)}
                    </p>
                  </div>

                  {entry.status === "paid" && entry.paidAt && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Paid On</p>
                      <p className="font-medium" data-testid={`text-paid-date-${entry.id}`}>
                        {format(new Date(entry.paidAt), "PPp")}
                      </p>
                    </div>
                  )}

                  {entry.status === "paid" && entry.payerUserId && entry.payerName && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Paid By</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium" data-testid={`text-payer-${entry.id}`}>
                          {entry.payerName} ({entry.payerUserId})
                        </span>
                      </div>
                    </div>
                  )}

                  {entry.status === "waiting" && entry.payerUserId && entry.payerName && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Reserved By</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium" data-testid={`text-reserved-by-${entry.id}`}>
                          {entry.payerName} ({entry.payerUserId})
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Payment pending confirmation from this user's activation...
                      </p>
                    </div>
                  )}

                  {entry.status === "waiting" && !entry.payerUserId && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Waiting for the next activation to process your payment...
                      </p>
                    </div>
                  )}

                  {entry.status === "reserved" && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Reserved for activation in progress. Payment pending confirmation...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle data-testid="heading-how-it-works">How Binary Match Queue Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p data-testid="text-prerequisite-explanation"><strong>Prerequisite (One-Time):</strong> You must have <strong>1 direct left + 1 direct right</strong> personal referral to qualify. This is a one-time requirement.</p>
          <p data-testid="text-build-pairs">• <strong>Build Pairs:</strong> After qualification, build 3:3 matched pairs (3 left + 3 right activations from your entire team including spillover) to enter the queue</p>
          <p data-testid="text-fifo-queue">• <strong>FIFO Queue:</strong> Queue operates on First In, First Out principle</p>
          <p data-testid="text-payment-info">• <strong>Payment:</strong> Each new activation pays ₹1,000 to the first person in the queue</p>
          <p data-testid="text-carry-forward">• <strong>Carry Forward:</strong> Unmatched legs carry forward to your next pair qualification</p>
          <p data-testid="text-unlimited">• <strong>Unlimited:</strong> You can enter the queue multiple times by building additional 3:3 pairs</p>
        </CardContent>
      </Card>
    </div>
  );
}
