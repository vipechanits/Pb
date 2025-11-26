import { Link, useLocation } from 'wouter';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Grid3x3,
  RefreshCw,
  UserCircle,
  Settings,
  Shield,
  FileCheck,
  FileText,
  UserCog,
  LogOut,
  Wallet,
  CheckSquare,
  BarChart3,
  Database,
  Clock,
  Trophy,
  TrendingUp,
  UserPlus,
  DollarSign,
  MessageCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import logoUrl from '@assets/payback247-logo_1763267164811.png';

interface AppSidebarProps {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin = false }: AppSidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  // Fetch pending confirmations count for notification badge
  const { data: pendingData } = useQuery<{ count: number }>({
    queryKey: ['/api/activation-payments/pending-count'],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!user, // Only fetch when user is logged in
  });

  const handleLogout = async () => {
    await logout();
    setLocation('/auth/login');
  };

  // Organized User Menu Groups
  const userDashboardItems = [
    {
      title: 'Dashboard',
      url: '/user',
      icon: LayoutDashboard,
    },
  ];

  const activationItems = [
    {
      title: 'Activation',
      url: '/user/activation',
      icon: Wallet,
    },
    {
      title: 'Payment Confirmations',
      url: '/user/confirmation',
      icon: CheckSquare,
    },
  ];

  const networkItems = [
    {
      title: 'Binary Tree',
      url: '/user/binary-tree',
      icon: GitBranch,
    },
    {
      title: 'Global Matrix',
      url: '/user/global-matrix',
      icon: Grid3x3,
    },
    {
      title: 'Direct Sponsoring',
      url: '/user/direct-sponsoring',
      icon: UserPlus,
    },
  ];

  const incomeItems = [
    {
      title: 'Income Summary',
      url: '/user/transaction-history',
      icon: DollarSign,
    },
    {
      title: 'Binary Match Queue',
      url: '/user/binary-match-queue-history',
      icon: Clock,
    },
    {
      title: 'Binary Pair Matching',
      url: '/user/binary-pair-matching-history',
      icon: Trophy,
    },
    {
      title: 'Matrix Income',
      url: '/user/matrix-income-history',
      icon: TrendingUp,
    },
  ];

  const accountItems = [
    {
      title: 'Re-entry Cycles',
      url: '/user/reentry',
      icon: RefreshCw,
    },
    {
      title: 'Support Tickets',
      url: '/user/tickets',
      icon: MessageCircle,
    },
  ];

  // Admin Menu Items
  const adminDashboardItems = [
    {
      title: 'Admin Dashboard',
      url: '/admin',
      icon: Shield,
    },
    {
      title: 'Analytics',
      url: '/admin/analytics',
      icon: BarChart3,
    },
  ];

  const adminPaymentItems = [
    {
      title: 'Payment Confirmations',
      url: '/admin/payments',
      icon: FileCheck,
    },
    {
      title: 'Payments Report',
      url: '/admin/payments-report',
      icon: FileText,
    },
  ];

  const adminManagementItems = [
    {
      title: 'User Management',
      url: '/admin/users',
      icon: UserCog,
    },
    {
      title: 'Re-entry Management',
      url: '/admin/reentry',
      icon: RefreshCw,
    },
  ];

  const adminSystemItems = [
    {
      title: 'System Configuration',
      url: '/admin/config',
      icon: Settings,
    },
    {
      title: 'Database Backup',
      url: '/admin/database',
      icon: Database,
    },
    {
      title: 'Backup Management',
      url: '/admin/backups',
      icon: Database,
    },
    {
      title: 'Security',
      url: '/admin/security',
      icon: Shield,
    },
  ];

  const pendingCount = pendingData?.count || 0;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <img src={logoUrl} alt="PAYBACK247" className="w-32 h-32 my-3" />
          </div>
          {user && (
            <div className="pt-2 border-t border-sidebar-border">
              <div className="text-xs text-muted-foreground">Logged in as</div>
              <div className="font-mono text-sm font-semibold" data-testid="text-user-id">
                {user.userId || 'N/A'}
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {isAdmin ? (
          <>
            {/* Admin Dashboard */}
            <SidebarGroup>
              <SidebarGroupLabel>Overview</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminDashboardItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Admin Payments */}
            <SidebarGroup>
              <SidebarGroupLabel>Payments</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminPaymentItems.map((item) => {
                    const showBadge = item.title === 'Payment Confirmations' && pendingCount > 0;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location === item.url}>
                          <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                            {showBadge && (
                              <Badge 
                                variant="destructive" 
                                className="ml-auto" 
                                data-testid="badge-pending-count"
                              >
                                {pendingCount}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Admin Management */}
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminManagementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Admin System */}
            <SidebarGroup>
              <SidebarGroupLabel>System</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminSystemItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <>
            {/* User Dashboard */}
            <SidebarGroup>
              <SidebarGroupLabel>Overview</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {userDashboardItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Activation & Payments */}
            <SidebarGroup>
              <SidebarGroupLabel>Activation & Payments</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {activationItems.map((item) => {
                    const showBadge = item.title === 'Payment Confirmations' && pendingCount > 0;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location === item.url}>
                          <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                            {showBadge && (
                              <Badge 
                                variant="destructive" 
                                className="ml-auto" 
                                data-testid="badge-pending-count"
                              >
                                {pendingCount}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Network Structure */}
            <SidebarGroup>
              <SidebarGroupLabel>Network Structure</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {networkItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Income Tracking */}
            <SidebarGroup>
              <SidebarGroupLabel>Income Tracking</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {incomeItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Account Management */}
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {accountItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
