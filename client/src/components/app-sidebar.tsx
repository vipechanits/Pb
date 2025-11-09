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
  UserCog,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import logoUrl from '@assets/Generated Image October 16, 2025 - 6_58AM (1)_1762653844897.png';

interface AppSidebarProps {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin = false }: AppSidebarProps) {
  const [location] = useLocation();
  // TODO: Replace with actual user authentication
  const userId = null;

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
      title: 'Direct Sponsoring',
      url: '/user/sponsoring',
      icon: Users,
    },
    {
      title: 'Binary Matching',
      url: '/user/binary',
      icon: GitBranch,
    },
    {
      title: 'Matrix Income',
      url: '/user/matrix',
      icon: Grid3x3,
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
      title: 'Payment Confirmations',
      url: '/admin/payments',
      icon: FileCheck,
    },
    {
      title: 'User Management',
      url: '/admin/users',
      icon: UserCog,
    },
    {
      title: 'Settings',
      url: '/admin/settings',
      icon: Settings,
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="PAYBACK247" className="w-10 h-10" />
            <div>
              <div className="font-semibold text-sm">PAYBACK247</div>
              <div className="text-xs text-muted-foreground">HybridP2P Platform</div>
            </div>
          </div>
          <div className="pt-2">
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <Badge variant="secondary">Non-blockchain Mode</Badge>
          </div>
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
      </SidebarContent>
    </Sidebar>
  );
}
