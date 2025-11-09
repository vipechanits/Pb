import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdminPayments() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Payment Approval Queue</h1>
        <p className="text-muted-foreground">
          Review and approve user payment submissions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Completed reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Queue</CardTitle>
          <CardDescription>
            Review offline payment proofs and transaction confirmations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No pending payments</p>
            <p className="text-sm">Payment submissions will appear here for admin review</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Payment Approval Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. User Submits Payment</h4>
            <p className="text-muted-foreground">Users enter UTR/Transaction ID and upload payment proof</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Admin Reviews</h4>
            <p className="text-muted-foreground">Verify the transaction details match the submitted proof</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Approve or Reject</h4>
            <p className="text-muted-foreground">Approve valid payments or reject with reason for correction</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. User Notified</h4>
            <p className="text-muted-foreground">Users receive status update and can proceed with activation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
