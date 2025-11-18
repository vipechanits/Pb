import { Link, useLocation } from 'wouter';
import { LayoutDashboard, GitBranch, Grid3x3, UserCircle, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const [location] = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/user', matches: ['/user', '/user/dashboard'] },
    { icon: GitBranch, label: 'Binary', path: '/user/binary-tree', matches: ['/user/binary-tree'] },
    { icon: Grid3x3, label: 'Matrix', path: '/user/global-matrix', matches: ['/user/global-matrix'] },
    { icon: Wallet, label: 'Payments', path: '/user/confirmation', matches: ['/user/confirmation', '/user/activation'] },
    { icon: UserCircle, label: 'Profile', path: '/user/profile', matches: ['/user/profile'] },
  ];
  
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = item.matches.some(match => location.startsWith(match));
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={cn(
                "flex flex-col items-center justify-center h-full w-full transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
