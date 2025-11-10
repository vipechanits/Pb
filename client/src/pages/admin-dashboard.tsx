import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, GitBranch, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ReferralLinks } from '@/components/referral-links';

export default function AdminDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Users',
      value: '1',
      description: 'Registered members',
      icon: Users,
    },
    {
      title: 'Active Activations',
      value: '0',
      description: 'Ongoing activations',
      icon: GitBranch,
    },
    {
      title: 'Pending Payments',
      value: '0',
      description: 'Awaiting approval',
      icon: DollarSign,
    },
    {
      title: 'Total Revenue',
      value: '₹0',
      description: 'Platform fees collected',
      icon: DollarSign,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-dashboard">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and management controls
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Authentication</span>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="text-xs text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment System</span>
              <span className="text-xs text-green-600 font-medium">Operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <div className="p-4 border rounded-lg hover-elevate cursor-pointer">
              <h3 className="font-semibold mb-1">Review Payments</h3>
              <p className="text-xs text-muted-foreground">Approve pending transactions</p>
            </div>
            <div className="p-4 border rounded-lg hover-elevate cursor-pointer">
              <h3 className="font-semibold mb-1">Manage Users</h3>
              <p className="text-xs text-muted-foreground">View and edit user accounts</p>
            </div>
            <div className="p-4 border rounded-lg hover-elevate cursor-pointer">
              <h3 className="font-semibold mb-1">System Settings</h3>
              <p className="text-xs text-muted-foreground">Configure platform parameters</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Admin Referral Links</h2>
          <p className="text-muted-foreground">Share these permanent links to grow your network</p>
        </div>
        <ReferralLinks />
      </div>
    </div>
  );
}
