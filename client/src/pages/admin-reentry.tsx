import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  RefreshCw,
  Trophy,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Search,
  Loader2,
} from 'lucide-react';

interface ReentryRecord {
  id: string;
  userId: string;
  userName: string | null;
  cycleNumber: number;
  status: string;
  initiatedAt: string | null;
  completedAt: string | null;
  activationId: string | null;
}

interface ReentryStats {
  byStatus: Array<{ status: string; count: number }>;
  eligibleUsers: number;
}

export default function AdminReentry() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState<string | null>(null);

  // Fetch all re-entries
  const { data: reentries, isLoading: reentriesLoading } = useQuery<ReentryRecord[]>({
    queryKey: ['/api/admin/reentry/all'],
  });

  // Fetch re-entry statistics
  const { data: stats } = useQuery<ReentryStats>({
    queryKey: ['/api/admin/reentry/stats'],
  });

  // Manual eligibility check mutation
  const checkEligibilityMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/admin/reentry/eligibility/${userId}/check`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reentry/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reentry/stats'] });
      toast({
        title: 'Eligibility Check Complete',
        description: `User ${data.userId} eligibility status updated`,
      });
      setCheckingEligibility(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check eligibility',
        variant: 'destructive',
      });
      setCheckingEligibility(null);
    },
  });

  const handleCheckEligibility = async (userId: string) => {
    setCheckingEligibility(userId);
    checkEligibilityMutation.mutate(userId);
  };

  // Filter re-entries based on search
  const filteredReentries = reentries?.filter(
    (r) =>
      r.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalReentries = reentries?.length || 0;
  const completedCount =
    stats?.byStatus.find((s) => s.status === 'completed')?.count || 0;
  const inProgressCount =
    stats?.byStatus.find((s) => s.status === 'in_progress')?.count || 0;
  const eligibleCount = stats?.eligibleUsers || 0;

  const statsCards = [
    {
      title: 'Total Re-entries',
      value: totalReentries.toString(),
      description: 'All re-entry cycles',
      icon: RefreshCw,
      color: 'text-blue-600',
    },
    {
      title: 'Completed',
      value: completedCount.toString(),
      description: 'Finished cycles',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'In Progress',
      value: inProgressCount.toString(),
      description: 'Active cycles',
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      title: 'Eligible Users',
      value: eligibleCount.toString(),
      description: 'Ready for re-entry',
      icon: Trophy,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-reentry">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Re-entry Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage user re-entry cycles
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Re-entries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>All Re-entry Cycles</CardTitle>
              <CardDescription>View and manage all user re-entries</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user ID or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[300px]"
                  data-testid="input-search-reentry"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reentriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading re-entries...</span>
            </div>
          ) : filteredReentries && filteredReentries.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Cycle #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Initiated</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Activation ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReentries.map((reentry) => (
                    <TableRow key={reentry.id} data-testid={`row-reentry-${reentry.id}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{reentry.userName || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {reentry.userId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          #{reentry.cycleNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            reentry.status === 'completed'
                              ? 'default'
                              : reentry.status === 'in_progress'
                              ? 'outline'
                              : 'secondary'
                          }
                          className={
                            reentry.status === 'in_progress'
                              ? 'border-blue-500 text-blue-500'
                              : ''
                          }
                        >
                          {reentry.status === 'completed'
                            ? 'Completed'
                            : reentry.status === 'in_progress'
                            ? 'In Progress'
                            : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {reentry.initiatedAt
                          ? format(new Date(reentry.initiatedAt), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {reentry.completedAt
                          ? format(new Date(reentry.completedAt), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {reentry.activationId ? (
                          <code className="text-xs">{reentry.activationId}</code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckEligibility(reentry.userId)}
                          disabled={
                            checkingEligibility === reentry.userId ||
                            checkEligibilityMutation.isPending
                          }
                          data-testid={`button-check-eligibility-${reentry.userId}`}
                        >
                          {checkingEligibility === reentry.userId ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Check
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? 'No re-entries found matching your search'
                : 'No re-entry cycles yet'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertTitle>Re-entry System Overview</AlertTitle>
        <AlertDescription>
          Users become eligible for re-entry after completing their matrix with 62 activated
          descendants. They can then initiate a new cycle and go through the 8-payment
          activation process again to earn from all income streams.
        </AlertDescription>
      </Alert>
    </div>
  );
}
