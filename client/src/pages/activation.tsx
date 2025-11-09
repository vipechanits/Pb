import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Circle, Clock, Info } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function ActivationPage() {
  const { user } = useAuth();

  const paymentSlots = [
    { id: 0, label: 'Direct Sponsor', receiver: 'Your Sponsor', amount: 625, status: 'pending' },
    { id: 1, label: 'Binary Match', receiver: 'Matched User', amount: 625, status: 'pending' },
    { id: 2, label: 'Creator Fee', receiver: 'Platform Admin', amount: 625, status: 'pending' },
    { id: 3, label: 'Matrix Level 1', receiver: 'Matrix Upline', amount: 625, status: 'pending' },
    { id: 4, label: 'Matrix Level 2', receiver: 'Matrix Upline', amount: 625, status: 'pending' },
    { id: 5, label: 'Matrix Level 3', receiver: 'Matrix Upline', amount: 625, status: 'pending' },
    { id: 6, label: 'Matrix Level 4', receiver: 'Matrix Upline', amount: 625, status: 'pending' },
    { id: 7, label: 'Matrix Level 5', receiver: 'Matrix Upline', amount: 625, status: 'pending' },
  ];

  const completedCount = paymentSlots.filter(slot => slot.status === 'completed').length;
  const totalAmount = paymentSlots.reduce((sum, slot) => sum + slot.amount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Account Activation</h1>
        <p className="text-muted-foreground">
          Complete 8 payments to activate your account and start earning
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Activation Fee: ₹{totalAmount.toLocaleString()}</strong>
          <br />
          Pay ₹625 to each of the 8 slots below. All payments are direct peer-to-peer transfers.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}/8</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(completedCount * 625).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">of ₹{totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{((8 - completedCount) * 625).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{8 - completedCount} payments left</p>
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
            {paymentSlots.map((slot) => (
              <div 
                key={slot.id}
                className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
              >
                <div className="flex items-center gap-3">
                  {slot.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : slot.status === 'pending_verification' ? (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{slot.label}</p>
                    <p className="text-xs text-muted-foreground">{slot.receiver}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold">₹{slot.amount}</p>
                    <Badge 
                      variant={
                        slot.status === 'completed' ? 'default' : 
                        slot.status === 'pending_verification' ? 'secondary' : 
                        'outline'
                      }
                      className="text-xs"
                    >
                      {slot.status === 'completed' ? 'Paid' : 
                       slot.status === 'pending_verification' ? 'Pending' : 
                       'Not Paid'}
                    </Badge>
                  </div>
                  {slot.status === 'pending' && (
                    <Button size="sm" data-testid={`button-pay-${slot.id}`}>
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
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
            <p className="text-muted-foreground">Transfer ₹625 to the receiver's UPI ID or bank account via Google Pay, Paytm, or PhonePe</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Submit Proof</h4>
            <p className="text-muted-foreground">Enter your UTR/Transaction ID and upload payment screenshot</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Wait for Approval</h4>
            <p className="text-muted-foreground">Admin will verify your payment and the receiver will confirm receipt</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
