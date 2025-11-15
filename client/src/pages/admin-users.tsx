import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Mail, User, Shield, Filter, X, RefreshCw, ArrowLeft, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface AdminUser {
  id: string;
  userId: string;
  email: string;
  role: 'admin' | 'user';
  name: string | null;
  mobile: string | null;
  upiId: string | null;
  sponsorId: string | null;
  sponsorRequestedLeg: 'left' | 'right' | null;
  binaryParentId: string | null;
  binaryPlacementLeg: 'left' | 'right' | null;
  leftLegCount: number;
  rightLegCount: number;
  personalLeftCount: number;
  personalRightCount: number;
  totalReferrals: number;
  binaryQualified: boolean;
  binaryMatchedPairs: number;
  matrixParentId: string | null;
  matrixPosition: number | null;
  matrixLevel: number | null;
  matrixPath: string | null;
  isProfileComplete: boolean;
  isActivated: boolean;
  activatedAt: string | null;
  reentryCount: number;
  currentCycleNumber: number;
  isEligibleForReentry: boolean;
  lastReentryAt: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activationFilter, setActivationFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [binaryLegFilter, setBinaryLegFilter] = useState<string>('all');
  const [sponsorIdFilter, setSponsorIdFilter] = useState('');
  const [matrixLevelFilter, setMatrixLevelFilter] = useState<string>('all');
  const [reentryEligibleFilter, setReentryEligibleFilter] = useState<string>('all');
  const [binaryQualifiedFilter, setBinaryQualifiedFilter] = useState<string>('all');

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (activationFilter !== 'all') params.append('activationStatus', activationFilter);
    if (roleFilter !== 'all') params.append('role', roleFilter);
    if (binaryLegFilter !== 'all') params.append('binaryLeg', binaryLegFilter);
    if (sponsorIdFilter) params.append('sponsorId', sponsorIdFilter);
    if (matrixLevelFilter !== 'all') params.append('matrixLevel', matrixLevelFilter);
    if (reentryEligibleFilter !== 'all') params.append('reentryEligible', reentryEligibleFilter);
    if (binaryQualifiedFilter !== 'all') params.append('binaryQualified', binaryQualifiedFilter);
    return params.toString();
  };

  // Fetch users with filters
  const { data: users, isLoading, refetch } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users', buildQueryParams()],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const url = `/api/admin/users${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const clearAllFilters = () => {
    setSearchQuery('');
    setActivationFilter('all');
    setRoleFilter('all');
    setBinaryLegFilter('all');
    setSponsorIdFilter('');
    setMatrixLevelFilter('all');
    setReentryEligibleFilter('all');
    setBinaryQualifiedFilter('all');
  };

  const hasActiveFilters = searchQuery || activationFilter !== 'all' || roleFilter !== 'all' || 
    binaryLegFilter !== 'all' || sponsorIdFilter || matrixLevelFilter !== 'all' || 
    reentryEligibleFilter !== 'all' || binaryQualifiedFilter !== 'all';

  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(u => u.isActivated).length || 0;
  const adminUsers = users?.filter(u => u.role === 'admin').length || 0;
  const pendingUsers = users?.filter(u => !u.isActivated).length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all platform users with advanced filtering
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="default"
          data-testid="button-refresh-users"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Activated accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">Admin users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers}</div>
            <p className="text-xs text-muted-foreground">Not activated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Filters
              </CardTitle>
              <CardDescription>Filter users by multiple criteria</CardDescription>
            </div>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllFilters}
                data-testid="button-clear-filters"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search ID, email, name, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                data-testid="input-search-users"
              />
            </div>

            {/* Activation Status */}
            <Select value={activationFilter} onValueChange={setActivationFilter}>
              <SelectTrigger data-testid="select-activation-status">
                <SelectValue placeholder="Activation Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="activated">Activated</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            {/* Role */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger data-testid="select-role">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            {/* Binary Leg */}
            <Select value={binaryLegFilter} onValueChange={setBinaryLegFilter}>
              <SelectTrigger data-testid="select-binary-leg">
                <SelectValue placeholder="Binary Leg" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Legs</SelectItem>
                <SelectItem value="left">Left Leg</SelectItem>
                <SelectItem value="right">Right Leg</SelectItem>
              </SelectContent>
            </Select>

            {/* Sponsor ID */}
            <Input
              type="text"
              placeholder="Sponsor ID (e.g., PB10000)"
              value={sponsorIdFilter}
              onChange={(e) => setSponsorIdFilter(e.target.value)}
              data-testid="input-sponsor-id"
            />

            {/* Matrix Level */}
            <Select value={matrixLevelFilter} onValueChange={setMatrixLevelFilter}>
              <SelectTrigger data-testid="select-matrix-level">
                <SelectValue placeholder="Matrix Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="1">Level 1</SelectItem>
                <SelectItem value="2">Level 2</SelectItem>
                <SelectItem value="3">Level 3</SelectItem>
                <SelectItem value="4">Level 4</SelectItem>
                <SelectItem value="5">Level 5</SelectItem>
                <SelectItem value="6">Level 6+</SelectItem>
              </SelectContent>
            </Select>

            {/* Re-entry Eligible */}
            <Select value={reentryEligibleFilter} onValueChange={setReentryEligibleFilter}>
              <SelectTrigger data-testid="select-reentry-eligible">
                <SelectValue placeholder="Re-entry Eligible" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="true">Eligible for Re-entry</SelectItem>
                <SelectItem value="false">Not Eligible</SelectItem>
              </SelectContent>
            </Select>

            {/* Binary Qualified */}
            <Select value={binaryQualifiedFilter} onValueChange={setBinaryQualifiedFilter}>
              <SelectTrigger data-testid="select-binary-qualified">
                <SelectValue placeholder="Binary Qualified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="true">Binary Qualified</SelectItem>
                <SelectItem value="false">Not Qualified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            All Users 
            {users && <span className="text-muted-foreground font-normal ml-2">({users.length} result{users.length !== 1 ? 's' : ''})</span>}
          </CardTitle>
          <CardDescription>Comprehensive user list with all details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No users found</p>
              <p className="text-sm">Try adjusting your filter criteria</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 border rounded-lg hover-elevate"
                  data-testid={`user-card-${user.userId}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {user.role === 'admin' ? <Shield className="w-5 h-5 text-primary" /> : <User className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-lg">{user.name || 'No name set'}</p>
                            {user.role === 'admin' && (
                              <Badge variant="default" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            <Badge variant={user.isActivated ? 'default' : 'secondary'} className={user.isActivated ? 'bg-green-600' : ''}>
                              {user.isActivated ? 'Activated' : 'Pending'}
                            </Badge>
                            {user.isEligibleForReentry && (
                              <Badge variant="default" className="bg-purple-600 text-xs">
                                Re-entry Eligible
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span className="font-mono font-semibold text-foreground">{user.userId}</span>
                            <span>•</span>
                            <span>{user.email}</span>
                            {user.mobile && (
                              <>
                                <span>•</span>
                                <span>{user.mobile}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                          {/* Sponsor Info */}
                          {user.sponsorId && (
                            <div>
                              <p className="text-muted-foreground text-xs">Sponsor</p>
                              <p className="font-mono font-semibold flex items-center gap-1">
                                {user.sponsorId}
                                {user.sponsorRequestedLeg && (
                                  user.sponsorRequestedLeg === 'left' ? 
                                    <ArrowLeft className="w-3 h-3 text-blue-500" /> : 
                                    <ArrowRight className="w-3 h-3 text-green-500" />
                                )}
                              </p>
                            </div>
                          )}

                          {/* Binary Stats */}
                          <div>
                            <p className="text-muted-foreground text-xs">Binary Legs</p>
                            <p className="font-semibold">
                              L:{user.leftLegCount} • R:{user.rightLegCount}
                            </p>
                          </div>

                          <div>
                            <p className="text-muted-foreground text-xs">Personal</p>
                            <p className="font-semibold">
                              L:{user.personalLeftCount} • R:{user.personalRightCount}
                            </p>
                          </div>

                          <div>
                            <p className="text-muted-foreground text-xs">Binary Match</p>
                            <p className="font-semibold flex items-center gap-1">
                              {user.binaryQualified ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  {user.binaryMatchedPairs} pairs
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-red-600" />
                                  Not Qualified
                                </>
                              )}
                            </p>
                          </div>

                          {/* Matrix Info */}
                          {user.matrixLevel && (
                            <>
                              <div>
                                <p className="text-muted-foreground text-xs">Matrix Level</p>
                                <p className="font-semibold">Level {user.matrixLevel}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Matrix Parent</p>
                                <p className="font-mono text-xs">{user.matrixParentId || 'Root'}</p>
                              </div>
                            </>
                          )}

                          {/* Re-entry Info */}
                          <div>
                            <p className="text-muted-foreground text-xs">Cycle / Re-entries</p>
                            <p className="font-semibold">
                              #{user.currentCycleNumber} ({user.reentryCount} re-entries)
                            </p>
                          </div>

                          {/* Referrals */}
                          <div>
                            <p className="text-muted-foreground text-xs">Total Referrals</p>
                            <p className="font-semibold">{user.totalReferrals}</p>
                          </div>

                          {/* Joined Date */}
                          <div>
                            <p className="text-muted-foreground text-xs">Joined</p>
                            <p className="text-xs">{format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
                          </div>

                          {/* Activation Date */}
                          {user.activatedAt && (
                            <div>
                              <p className="text-muted-foreground text-xs">Activated</p>
                              <p className="text-xs">{format(new Date(user.activatedAt), 'MMM d, yyyy')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" data-testid={`button-view-${user.userId}`}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
