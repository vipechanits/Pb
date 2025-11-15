import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";
import { format } from "date-fns";

const SLOT_LABELS: Record<number, string> = {
  0: "Direct Sponsor",
  1: "Binary Match",
  2: "Top Reward Payment",
  3: "Matrix Level 1",
  4: "Matrix Level 2",
  5: "Matrix Level 3",
  6: "Matrix Level 4",
  7: "Matrix Level 5",
};

interface ConfirmedPayment {
  id: string;
  activationId: string;
  slotIndex: number;
  payerUserId: string;
  receiverUserId: string | null;
  amountInr: string;
  status: string;
  confirmedAt: string | null;
  offlineUtrId: string | null;
  offlineProofUrl: string | null;
  submissionCount: number;
  notes: string | null;
  payerName: string | null;
  receiverName: string | null;
}

export default function AdminPaymentsReport() {
  const { data: payments, isLoading } = useQuery<ConfirmedPayment[]>({
    queryKey: ["/api/admin/payments/confirmed"],
  });

  const totalAmount = payments?.reduce((sum, p) => sum + parseFloat(p.amountInr), 0) || 0;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-payments-report">
            Confirmed Payments Report
          </h1>
          <p className="text-muted-foreground">
            All confirmed activation payments in the system
          </p>
        </div>
        <Button variant="outline" data-testid="button-export">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-count">
              {payments?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-amount">
              ₹{totalAmount.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Payers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-unique-payers">
              {new Set(payments?.map(p => p.payerUserId)).size || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            Detailed view of all confirmed payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading payments...
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-payments">
              No confirmed payments found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>UTR/Transaction ID</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Proof</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell className="text-sm">
                        {payment.confirmedAt
                          ? format(new Date(payment.confirmedAt), "MMM dd, yyyy HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium" data-testid={`text-payer-id-${payment.id}`}>
                            {payment.payerUserId}
                          </div>
                          {payment.payerName && (
                            <div className="text-sm text-muted-foreground">
                              {payment.payerName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {payment.receiverUserId || "Admin"}
                          </div>
                          {payment.receiverName && (
                            <div className="text-sm text-muted-foreground">
                              {payment.receiverName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="no-default-active-elevate">
                          {SLOT_LABELS[payment.slotIndex] || `Slot ${payment.slotIndex}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{parseFloat(payment.amountInr).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.offlineUtrId || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.submissionCount > 1 ? "secondary" : "outline"}>
                          {payment.submissionCount}x
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.offlineProofUrl ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            data-testid={`button-view-proof-${payment.id}`}
                          >
                            <a
                              href={payment.offlineProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {payment.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
