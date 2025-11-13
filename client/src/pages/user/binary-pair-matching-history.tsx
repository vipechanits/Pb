import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

interface PairEntry {
  id: string;
  enteredAt: string;
  queuePosition: number;
  status: string;
  paidAt: string | null;
  amountInr: string;
}

export default function BinaryPairMatchingHistory() {
  const { data: pairHistory, isLoading } = useQuery<PairEntry[]>({
    queryKey: ["/api/user/binary-pair-matching-history"],
  });

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
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPairs = pairHistory?.length || 0;
  const paidPairs = pairHistory?.filter((p) => p.status === "paid").length || 0;
  const waitingPairs = pairHistory?.filter((p) => p.status === "waiting" || p.status === "reserved").length || 0;
  const totalEarned = pairHistory
    ?.filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + parseFloat(p.amountInr), 0) || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-pair-history">Binary Pair Matching History</h1>
        <p className="text-muted-foreground" data-testid="text-description">
          View your 3:3 binary pair qualifications and corresponding queue earnings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pairs Built</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-pairs">{totalPairs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pairs Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-paid-pairs">{paidPairs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-total-earned">₹{totalEarned.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {!pairHistory || pairHistory.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground" data-testid="text-no-pairs">
                No matched pairs yet. Build your first 3:3 pair (3 left + 3 right activations) to qualify for binary match income!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle data-testid="heading-pair-list">Your Matched Pairs</CardTitle>
            <CardDescription>Each entry represents a 3:3 qualification that entered you into the binary match queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pairHistory.map((pair, index) => (
                <div
                  key={pair.id}
                  className="flex items-center justify-between p-4 rounded-md border hover-elevate"
                  data-testid={`card-pair-${pair.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold" data-testid={`text-pair-number-${pair.id}`}>
                        Pair #{totalPairs - index}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-qualified-date-${pair.id}`}>
                        Qualified: {format(new Date(pair.enteredAt), "PPp")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Queue Position: #{pair.queuePosition}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg" data-testid={`text-pair-amount-${pair.id}`}>
                      ₹{parseFloat(pair.amountInr).toFixed(2)}
                    </p>
                    {pair.status === "paid" ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid={`badge-paid-${pair.id}`}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" data-testid={`badge-waiting-${pair.id}`}>
                        <Clock className="w-3 h-3 mr-1" />
                        Waiting
                      </Badge>
                    )}
                    {pair.paidAt && (
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-pair-paid-date-${pair.id}`}>
                        {format(new Date(pair.paidAt), "PP")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle data-testid="heading-how-pairing-works">How 3:3 Pair Matching Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• <strong>Qualification:</strong> Build 3 activations on your left leg AND 3 activations on your right leg</p>
          <p>• <strong>Queue Entry:</strong> Once qualified, you automatically enter the binary match queue</p>
          <p>• <strong>Payment:</strong> You receive ₹1,000 when the next activation pays you from the queue (FIFO)</p>
          <p>• <strong>Carry Forward:</strong> Extra activations beyond the 3:3 pair carry forward to your next qualification</p>
          <p>• <strong>Unlimited:</strong> You can build multiple 3:3 pairs and enter the queue multiple times</p>
        </CardContent>
      </Card>
    </div>
  );
}
