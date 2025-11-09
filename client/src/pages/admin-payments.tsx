import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AdminPayments() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Confirmations</h1>
        <p className="text-muted-foreground">Review and approve offline payment proofs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Offline Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Offline payment confirmations require querying blockchain events or implementing a backend service to track pending payments. This feature will fetch real payment proof submissions from the contract's event logs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
