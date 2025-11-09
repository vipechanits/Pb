import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function ConfirmationPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Payment Confirmations</h1>
        <p className="text-muted-foreground">
          Confirm payments you've received from other users
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disputed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Issues reported</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Confirmations</CardTitle>
          <CardDescription>Review and confirm payments you've received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No pending confirmations</p>
            <p className="text-sm">When users pay you, their payments will appear here for confirmation</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Payment Confirmation Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. User Submits Payment</h4>
            <p className="text-muted-foreground">Someone makes a payment to you and enters their UTR/Transaction ID</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Admin Approves</h4>
            <p className="text-muted-foreground">Admin verifies the payment proof and approves the transaction</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. You Confirm Receipt</h4>
            <p className="text-muted-foreground">Check your payment app and confirm you received the amount</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Payment Completed</h4>
            <p className="text-muted-foreground">Once confirmed, the payment is marked complete and activation proceeds</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confirmation History</CardTitle>
          <CardDescription>Your past payment confirmations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            No confirmation history yet
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
