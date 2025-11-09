import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Users, GitBranch, Grid3x3, TrendingUp } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Earnings',
      value: '₹0',
      description: 'All time earnings',
      icon: TrendingUp,
    },
    {
      title: 'Direct Referrals',
      value: '0',
      description: 'Users you sponsored',
      icon: Users,
    },
    {
      title: 'Binary Matches',
      value: '0',
      description: 'Completed matches',
      icon: GitBranch,
    },
    {
      title: 'Matrix Position',
      value: 'Not Active',
      description: 'Current matrix level',
      icon: Grid3x3,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="user-dashboard">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome, {user?.name || user?.email}</h1>
        <p className="text-muted-foreground">
          User ID: <span className="font-mono font-semibold">{user?.userId || 'Not assigned'}</span>
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
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Complete your profile and start building your network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Next Steps:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Complete your profile with payment details</li>
              <li>Share your referral link with others</li>
              <li>Activate your account to start earning</li>
              <li>Track your network growth in the dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
