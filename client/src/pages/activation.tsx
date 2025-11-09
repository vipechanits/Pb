import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function ActivationPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Activation</CardTitle>
          <CardDescription>Non-blockchain version coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Under Construction</AlertTitle>
            <AlertDescription>
              The activation system is being rebuilt to work without blockchain integration.
              Features being migrated:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>8-payment activation flow</li>
                <li>Manual payment tracking with INR currency</li>
                <li>Payment proof upload</li>
                <li>User-to-user payment confirmation</li>
                <li>Admin payment approval</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
