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
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import logoUrl from '@assets/payback247-logo_1763267164811.png';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
    {
      title: 'TOP REWARD Recipients',
      url: '/admin/top-reward',
      icon: Trophy,
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

  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <img src={logoUrl} alt="PAYBACK247" className="w-28 h-auto object-contain" />
          </div>
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50">
              <Avatar className="h-10 w-10 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground" data-testid="text-user-name">
                  {user.name || 'User'}
                </p>
                <p className="font-mono text-xs font-semibold text-primary" data-testid="text-user-id">
                  {user.userId || 'N/A'}
                </p>
              </div>
              {user.isActivated && (
                <div className="flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              )}
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
      
      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              data-testid="button-logout"
              className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-3 pt-3 border-t border-sidebar-border/30 text-center">
          <p className="text-xs text-sidebar-foreground/40">PAYBACK247 v2.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
