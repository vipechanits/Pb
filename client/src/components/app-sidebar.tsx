import { useState } from 'react';
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
import NetworkBadge from './NetworkBadge';

interface AppSidebarProps {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin = false }: AppSidebarProps) {
  const [location] = useLocation();
  const walletAddress = '0x742d...bEb7'; // todo: remove mock functionality

  const userMenuItems: Array<{
    title: string;
    url: string;
    icon: typeof LayoutDashboard;
    badge?: number;
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
    badge?: number;
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
      badge: 5, // todo: remove mock functionality
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
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">H</span>
            </div>
            <div>
              <div className="font-semibold text-sm">HybridP2P</div>
              <div className="text-xs text-muted-foreground">Rooted</div>
            </div>
          </div>
          <div className="pt-2">
            <div className="text-xs text-muted-foreground mb-1">Connected Wallet</div>
            <div className="font-mono text-xs">{walletAddress}</div>
            <div className="mt-2">
              <NetworkBadge network="polygon-amoy" isCorrect={true} />
            </div>
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
                      {'badge' in item && item.badge && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
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
