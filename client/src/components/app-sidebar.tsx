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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import logoUrl from '@assets/payback247-logo.png';

interface AppSidebarProps {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin = false }: AppSidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation('/auth/login');
  };

  const userMenuItems: Array<{
    title: string;
    url: string;
    icon: typeof LayoutDashboard;
  }> = [
    {
      title: 'Dashboard',
      url: '/user',
      icon: LayoutDashboard,
    },
    {
      title: 'Activation',
      url: '/user/activation',
      icon: Wallet,
    },
    {
      title: 'Confirmations',
      url: '/user/confirmation',
      icon: CheckSquare,
    },
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
    {
      title: 'Re-entry Cycles',
      url: '/user/reentry',
      icon: RefreshCw,
    },
    {
      title: 'Profile',
      url: '/user/profile',
      icon: UserCircle,
    },
  ];

  const incomeHistoryItems: Array<{
    title: string;
    url: string;
    icon: typeof Clock;
  }> = [
    {
      title: 'Transaction History',
      url: '/user/transaction-history',
      icon: FileText,
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

  const adminMenuItems: Array<{
    title: string;
    url: string;
    icon: typeof LayoutDashboard;
  }> = [
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
      title: 'Re-entry Management',
      url: '/admin/reentry',
      icon: RefreshCw,
    },
    {
      title: 'System Configuration',
      url: '/admin/config',
      icon: Settings,
    },
    {
      title: 'User Management',
      url: '/admin/users',
      icon: UserCog,
    },
    {
      title: 'Database Backup',
      url: '/admin/database',
      icon: Database,
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="space-y-2">
          <div className="flex items-center justify-center">
            <img src={logoUrl} alt="PAYBACK247" className="w-80 h-80" />
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
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? 'Admin Panel' : 'User Menu'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
        
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Income History</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {incomeHistoryItems.map((item) => (
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
