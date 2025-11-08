import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    mobile: '+91 9876543210',
  });

  const [paymentCard, setPaymentCard] = useState({
    holderName: 'John Doe',
    bankName: 'HDFC Bank',
    accountNumber: '123456789012',
    ifsc: 'HDFC0001234',
    upi: 'john@upi',
  });

  const handleUpdateProfile = () => {
    console.log('Profile updated:', profileData);
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated.',
    });
  };

  const handleUpdatePaymentCard = () => {
    console.log('Payment card updated:', paymentCard);
    toast({
      title: 'Payment Card Updated',
      description: 'Your payment card details have been saved.',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your account information and payment details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="text-2xl">JD</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" data-testid="button-upload-avatar">
              <User className="w-4 h-4 mr-2" />
              Upload Avatar
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={profileData.mobile}
                onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                data-testid="input-mobile"
              />
            </div>
            <Button onClick={handleUpdateProfile} data-testid="button-update-profile">
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Card Details
          </CardTitle>
          <CardDescription>
            Configure your bank account or UPI for receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="holder">Account Holder Name</Label>
              <Input
                id="holder"
                value={paymentCard.holderName}
                onChange={(e) => setPaymentCard({ ...paymentCard, holderName: e.target.value })}
                data-testid="input-holder-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank">Bank Name</Label>
              <Input
                id="bank"
                value={paymentCard.bankName}
                onChange={(e) => setPaymentCard({ ...paymentCard, bankName: e.target.value })}
                data-testid="input-bank-name"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">Account Number</Label>
              <Input
                id="account"
                value={paymentCard.accountNumber}
                onChange={(e) => setPaymentCard({ ...paymentCard, accountNumber: e.target.value })}
                data-testid="input-account-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifsc">IFSC / SWIFT Code</Label>
              <Input
                id="ifsc"
                value={paymentCard.ifsc}
                onChange={(e) => setPaymentCard({ ...paymentCard, ifsc: e.target.value })}
                data-testid="input-ifsc"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="upi">UPI ID</Label>
            <Input
              id="upi"
              value={paymentCard.upi}
              onChange={(e) => setPaymentCard({ ...paymentCard, upi: e.target.value })}
              data-testid="input-upi"
            />
          </div>
          <Button onClick={handleUpdatePaymentCard} data-testid="button-update-payment">
            Update Payment Details
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
