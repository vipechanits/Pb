import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, IndianRupee, GitBranch, AlertCircle, Key, Eye, EyeOff, Loader, CreditCard, Cog, X, Download, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { ReferralLinks } from '@/components/referral-links';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingActivations: 0,
    pendingPayments: 0,
    totalIncome: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedModal, setSelectedModal] = useState<'activations' | 'payments' | null>(null);
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportLoading, setReportLoading] = useState(false);
  const [receiverTypeFilter, setReceiverTypeFilter] = useState<'all' | 'admin' | 'user'>('all');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await apiRequest('GET', '/api/admin/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats({
        totalUsers: data.totalUsers || 0,
        pendingActivations: data.pendingActivations || 0,
        pendingPayments: data.pendingPayments || 0,
        totalIncome: data.totalIncome || 0,
      });
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load dashboard statistics',
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPendingActivations = async () => {
    try {
      setModalLoading(true);
      const response = await apiRequest('GET', '/api/admin/pending-activations');
      if (!response.ok) throw new Error('Failed to fetch pending activations');
      const data = await response.json();
      setModalData(data);
    } catch (error: any) {
      console.error('Failed to fetch pending activations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load pending activations',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      setModalLoading(true);
      const response = await apiRequest('GET', '/api/admin/pending-payments');
      if (!response.ok) throw new Error('Failed to fetch pending payments');
      const data = await response.json();
      setModalData(data);
    } catch (error: any) {
      console.error('Failed to fetch pending payments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load pending payments',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatClick = (title: string) => {
    if (title === 'Pending Activations') {
      setSelectedModal('activations');
      fetchPendingActivations();
    } else if (title === 'Pending Payments') {
      setSelectedModal('payments');
      fetchPendingPayments();
    }
  };

  const fetchReport = async (type: 'daily' | 'weekly' | 'monthly', receiverType?: string) => {
    try {
      setReportLoading(true);
      setReportType(type);
      const params = receiverType && receiverType !== 'all' ? `?receiverType=${receiverType}` : '';
      const response = await apiRequest('GET', `/api/admin/reports/${type}${params}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      const data = await response.json();
      setReportData(data);
    } catch (error: any) {
      console.error('Failed to fetch report:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load report',
      });
    } finally {
      setReportLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const params = receiverTypeFilter && receiverTypeFilter !== 'all' ? `?receiverType=${receiverTypeFilter}` : '';
      const response = await apiRequest('GET', `/api/admin/reports/export-csv${params}`);
      if (!response.ok) throw new Error('Failed to export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-report-${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to export CSV:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to export CSV',
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'All password fields are required',
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'New password and confirmation do not match',
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Password must be at least 8 characters long',
      });
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Call admin password change endpoint
      const response = await apiRequest('POST', '/api/admin/change-password', {
        currentPassword,
        newPassword,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
      
      toast({
        title: 'Password Changed',
        description: 'Your admin password has been updated successfully',
      });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to change password',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: statsLoading ? '...' : stats.totalUsers.toString(),
      description: 'Registered members',
      icon: Users,
    },
    {
      title: 'Pending Activations',
      value: statsLoading ? '...' : stats.pendingActivations.toString(),
      description: 'Users with incomplete activations',
      icon: GitBranch,
    },
    {
      title: 'Pending Payments',
      value: statsLoading ? '...' : stats.pendingPayments.toString(),
      description: 'Awaiting approval',
      icon: IndianRupee,
    },
    {
      title: 'Total Income',
      value: statsLoading ? '...' : `₹${stats.totalIncome.toLocaleString('en-IN')}`,
      description: 'Confirmed platform earnings',
      icon: IndianRupee,
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
        {statCards.map((stat) => (
          <Card 
            key={stat.title}
            className={['Pending Activations', 'Pending Payments'].includes(stat.title) ? 'cursor-pointer hover-elevate' : ''}
            onClick={() => ['Pending Activations', 'Pending Payments'].includes(stat.title) && handleStatClick(stat.title)}
            data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
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

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Link href="/admin/payments">
                <div className="p-4 border rounded-lg hover-elevate cursor-pointer transition-colors" data-testid="quick-action-payments">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Review Payments</h3>
                      <p className="text-xs text-muted-foreground">Approve pending transactions</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/admin/users">
                <div className="p-4 border rounded-lg hover-elevate cursor-pointer transition-colors" data-testid="quick-action-users">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Manage Users</h3>
                      <p className="text-xs text-muted-foreground">View and edit user accounts</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/admin/config">
                <div className="p-4 border rounded-lg hover-elevate cursor-pointer transition-colors" data-testid="quick-action-settings">
                  <div className="flex items-start gap-3">
                    <Cog className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">System Settings</h3>
                      <p className="text-xs text-muted-foreground">Configure platform parameters</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Admin Password
            </CardTitle>
            <CardDescription>Update your administrator account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    data-testid="input-current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    data-testid="button-toggle-current-password"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    data-testid="input-new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    data-testid="button-toggle-new-password"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    data-testid="input-confirm-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isChangingPassword}
                data-testid="button-change-password"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Payment Reports
              </CardTitle>
              <CardDescription>View daily, weekly, and monthly payment statistics</CardDescription>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={exportCSV}
              data-testid="button-export-csv"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button 
                variant={reportType === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => fetchReport('daily', receiverTypeFilter)}
                disabled={reportLoading}
                data-testid="button-daily-report"
              >
                Daily
              </Button>
              <Button 
                variant={reportType === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => fetchReport('weekly', receiverTypeFilter)}
                disabled={reportLoading}
                data-testid="button-weekly-report"
              >
                Weekly
              </Button>
              <Button 
                variant={reportType === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => fetchReport('monthly', receiverTypeFilter)}
                disabled={reportLoading}
                data-testid="button-monthly-report"
              >
                Monthly
              </Button>
            </div>

            <Select value={receiverTypeFilter} onValueChange={(value: any) => {
              setReceiverTypeFilter(value);
              if (reportData) {
                fetchReport(reportType, value);
              }
            }}>
              <SelectTrigger className="w-48" data-testid="select-receiver-type">
                <SelectValue placeholder="Filter by receiver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Receivers</SelectItem>
                <SelectItem value="admin">Admin Only (PB0)</SelectItem>
                <SelectItem value="user">Users Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reportData ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {reportType === 'daily' && `Date: ${reportData.date}`}
                {reportType === 'weekly' && `${reportData.weekStart} to ${reportData.weekEnd}`}
                {reportType === 'monthly' && `Month: ${reportData.month}`}
              </div>
              <div className="grid gap-3">
                {reportData.payments && reportData.payments.map((p: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium">{p.status}</span>
                      <span className="text-lg font-semibold">₹{parseFloat(p.total || '0').toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Count: {p.count}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹{reportData.totalAmount?.toLocaleString('en-IN') || '0'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Select a report period to view statistics</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Admin Referral Links</h2>
          <p className="text-muted-foreground">Share these permanent links to grow your network</p>
        </div>
        <ReferralLinks />
      </div>

      {selectedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedModal(null)}>
          <Card className="w-full max-w-2xl max-h-96 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>
                  {selectedModal === 'activations' ? 'Pending Activations' : 'Pending Payments'}
                </CardTitle>
                <CardDescription>
                  {selectedModal === 'activations' 
                    ? `${modalData.length} user${modalData.length !== 1 ? 's' : ''} with incomplete activations`
                    : `${modalData.length} payment${modalData.length !== 1 ? 's' : ''} awaiting approval`
                  }
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedModal(null)}
                data-testid="button-close-modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : modalData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="font-medium">No items to display</p>
                  <p className="text-sm">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modalData.map((item: any, index: number) => (
                    <div 
                      key={index}
                      className="p-4 border rounded-lg bg-muted/50 hover-elevate transition-colors"
                      data-testid={`list-item-${index}`}
                    >
                      {selectedModal === 'activations' ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">{item.userName || item.name || 'Unknown'}</div>
                            <div className="text-xs font-mono text-muted-foreground">{item.userId}</div>
                          </div>
                          <p className="text-xs text-muted-foreground">Email: {item.email}</p>
                          {item.activationProgress && (
                            <p className="text-xs text-muted-foreground">Progress: {item.activationProgress.confirmed}/{item.activationProgress.total} payments confirmed</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">₹{item.amount?.toLocaleString('en-IN') || '0'}</div>
                            <div className="text-xs font-semibold text-orange-600">{item.status || 'Pending'}</div>
                          </div>
                          <p className="text-xs text-muted-foreground">Payment Type: {item.paymentType?.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">From: {item.payerUserId}</p>
                          <p className="text-xs text-muted-foreground">To: {item.receiverUserId || 'Admin (PB0)'}</p>
                          {item.createdAt && (
                            <p className="text-xs text-muted-foreground">Submitted: {new Date(item.createdAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
