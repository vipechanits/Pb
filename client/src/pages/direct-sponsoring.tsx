import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, UserPlus, DollarSign } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function DirectSponsoring() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Referrals',
      value: '0',
      description: 'Direct sponsorships',
      icon: Users,
    },
    {
      title: 'Active Members',
      value: '0',
      description: 'Activated referrals',
      icon: UserPlus,
    },
    {
      title: 'Sponsor Earnings',
      value: '₹0',
      description: 'From direct referrals',
      icon: DollarSign,
    },
    {
      title: 'This Month',
      value: '0',
      description: 'New signups',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Direct Sponsoring</h1>
        <p className="text-muted-foreground">
          Track your direct referrals and sponsor income
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Direct Referrals</CardTitle>
          <CardDescription>Members who joined using your referral link</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No direct referrals yet</p>
            <p className="text-sm">Share your referral links to start building your network</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sponsor Income Breakdown</CardTitle>
          <CardDescription>Earnings from ₹625 per direct referral</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm">Total Referrals</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm">Payment per Referral</span>
              <span className="font-medium">₹625</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-semibold">Total Earned</span>
              <span className="text-lg font-bold">₹0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
