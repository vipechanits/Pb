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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Download, RefreshCw, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";

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
  createdAt: string;
  submittedAt: string | null;
  offlineUtrId: string | null;
  offlineProofUrl: string | null;
  submissionCount: number;
  notes: string | null;
  payerName: string | null;
  payerEmail: string | null;
  payerMobile: string | null;
  payerUpiId: string | null;
  receiverName: string | null;
  receiverEmail: string | null;
  receiverMobile: string | null;
  receiverUpiId: string | null;
}

export default function AdminPaymentsReport() {
  const { data: payments, isLoading, refetch } = useQuery<ConfirmedPayment[]>({
    queryKey: ["/api/admin/payments/confirmed"],
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [slotFilter, setSlotFilter] = useState<string>("all");
  const [receiverFilter, setReceiverFilter] = useState<string>("all");

  // Apply filters to payments
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    
    return payments.filter(payment => {
      // Search filter (userId, email, mobile, UTR, activation ID)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          payment.payerUserId.toLowerCase().includes(term) ||
          payment.payerEmail?.toLowerCase().includes(term) ||
          payment.payerMobile?.toLowerCase().includes(term) ||
          payment.receiverUserId?.toLowerCase().includes(term) ||
          payment.receiverEmail?.toLowerCase().includes(term) ||
          payment.receiverMobile?.toLowerCase().includes(term) ||
          payment.offlineUtrId?.toLowerCase().includes(term) ||
          payment.activationId.toLowerCase().includes(term);
        
        if (!matchesSearch) return false;
      }

      // Slot filter
      if (slotFilter !== "all") {
        if (payment.slotIndex !== parseInt(slotFilter)) return false;
      }

      // Receiver filter
      if (receiverFilter !== "all") {
        if (receiverFilter === "admin" && payment.receiverUserId !== null) return false;
        if (receiverFilter === "user" && payment.receiverUserId === null) return false;
      }

      return true;
    });
  }, [payments, searchTerm, slotFilter, receiverFilter]);

  // Calculate statistics
  const totalAmount = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amountInr), 0);
  const uniquePayers = new Set(filteredPayments.map(p => p.payerUserId)).size;
  const uniqueReceivers = new Set(filteredPayments.map(p => p.receiverUserId || "ADMIN")).size;

  // Slot breakdown statistics
  const slotBreakdown = useMemo(() => {
    const breakdown: Record<number, { count: number; amount: number }> = {};
    filteredPayments.forEach(payment => {
      if (!breakdown[payment.slotIndex]) {
        breakdown[payment.slotIndex] = { count: 0, amount: 0 };
      }
      breakdown[payment.slotIndex].count += 1;
      breakdown[payment.slotIndex].amount += parseFloat(payment.amountInr);
    });
    return breakdown;
  }, [filteredPayments]);

  const clearFilters = () => {
    setSearchTerm("");
    setSlotFilter("all");
    setReceiverFilter("all");
  };

  const hasActiveFilters = searchTerm || slotFilter !== "all" || receiverFilter !== "all";

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-payments-report">
            Confirmed Payments Report
          </h1>
          <p className="text-muted-foreground">
            All confirmed activation payments in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="default"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-count">
              {filteredPayments.length}
            </div>
            {hasActiveFilters && payments && (
              <p className="text-xs text-muted-foreground">of {payments.length} total</p>
            )}
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
              {uniquePayers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Receivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-unique-receivers">
              {uniqueReceivers}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slot Breakdown Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Breakdown by Slot Type</CardTitle>
          <CardDescription>Distribution of confirmed payments across different slots</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {Object.entries(slotBreakdown).map(([slot, data]) => (
              <div key={slot} className="flex flex-col space-y-1 p-3 rounded-md border">
                <div className="text-sm font-medium text-muted-foreground">
                  {SLOT_LABELS[parseInt(slot)]}
                </div>
                <div className="text-xl font-bold">{data.count}</div>
                <div className="text-sm text-muted-foreground">
                  ₹{data.amount.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
              <CardDescription>Filter payments by various criteria</CardDescription>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="User ID, Email, Mobile, UTR, Activation ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Slot</label>
              <Select value={slotFilter} onValueChange={setSlotFilter}>
                <SelectTrigger data-testid="select-slot-filter">
                  <SelectValue placeholder="All Slots" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Slots</SelectItem>
                  {Object.entries(SLOT_LABELS).map(([slot, label]) => (
                    <SelectItem key={slot} value={slot}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Receiver Type</label>
              <Select value={receiverFilter} onValueChange={setReceiverFilter}>
                <SelectTrigger data-testid="select-receiver-filter">
                  <SelectValue placeholder="All Receivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Receivers</SelectItem>
                  <SelectItem value="admin">Admin (PB0)</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            Showing {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
            {hasActiveFilters && ` (filtered from ${payments?.length || 0} total)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading payments...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-payments">
              {hasActiveFilters ? "No payments match the current filters" : "No confirmed payments found"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Confirmed Date</TableHead>
                    <TableHead>Payer Details</TableHead>
                    <TableHead>Receiver Details</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>UTR/Transaction ID</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Activation ID</TableHead>
                    <TableHead>Proof</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {payment.confirmedAt
                          ? format(new Date(payment.confirmedAt), "MMM dd, yyyy HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[200px]">
                          <div className="font-medium" data-testid={`text-payer-id-${payment.id}`}>
                            {payment.payerUserId}
                          </div>
                          {payment.payerName && (
                            <div className="text-sm font-medium text-muted-foreground">
                              {payment.payerName}
                            </div>
                          )}
                          {payment.payerEmail && (
                            <div className="text-xs text-muted-foreground">
                              {payment.payerEmail}
                            </div>
                          )}
                          {payment.payerMobile && (
                            <div className="text-xs text-muted-foreground">
                              {payment.payerMobile}
                            </div>
                          )}
                          {payment.payerUpiId && (
                            <div className="text-xs font-mono text-muted-foreground">
                              UPI: {payment.payerUpiId}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[200px]">
                          <div className="font-medium">
                            {payment.receiverUserId || "PB0 (Admin)"}
                          </div>
                          {payment.receiverName && (
                            <div className="text-sm font-medium text-muted-foreground">
                              {payment.receiverName}
                            </div>
                          )}
                          {payment.receiverEmail && (
                            <div className="text-xs text-muted-foreground">
                              {payment.receiverEmail}
                            </div>
                          )}
                          {payment.receiverMobile && (
                            <div className="text-xs text-muted-foreground">
                              {payment.receiverMobile}
                            </div>
                          )}
                          {payment.receiverUpiId && (
                            <div className="text-xs font-mono text-muted-foreground">
                              UPI: {payment.receiverUpiId}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="no-default-active-elevate whitespace-nowrap">
                          {SLOT_LABELS[payment.slotIndex] || `Slot ${payment.slotIndex}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        ₹{parseFloat(payment.amountInr).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="space-y-1">
                          <div>{payment.offlineUtrId || "—"}</div>
                          {payment.submissionCount > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {payment.submissionCount} submissions
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground min-w-[150px]">
                        <div className="space-y-1">
                          <div>Created: {format(new Date(payment.createdAt), "MMM dd, HH:mm")}</div>
                          {payment.submittedAt && (
                            <div>Submitted: {format(new Date(payment.submittedAt), "MMM dd, HH:mm")}</div>
                          )}
                          {payment.confirmedAt && (
                            <div className="text-green-600 dark:text-green-400">
                              Confirmed: {format(new Date(payment.confirmedAt), "MMM dd, HH:mm")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {payment.activationId.slice(0, 8)}...
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
