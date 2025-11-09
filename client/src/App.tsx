import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import NotFound from '@/pages/not-found';
import Landing from '@/pages/landing';
import UserDashboard from '@/pages/user-dashboard';
import DirectSponsoring from '@/pages/direct-sponsoring';
import BinaryMatching from '@/pages/binary-matching';
import MatrixIncome from '@/pages/matrix-income';
import Profile from '@/pages/profile';
import ConfirmationPage from '@/pages/confirmation';
import ReentryPage from '@/pages/reentry';
import AdditionalReentryPage from '@/pages/additional-reentry';
import AdminDashboard from '@/pages/admin-dashboard';
import AdminPayments from '@/pages/admin-payments';
import { Web3Provider } from '@/context/Web3Context';

function DashboardLayout({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const style = {
    '--sidebar-width': '20rem',
    '--sidebar-width-icon': '4rem',
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar isAdmin={isAdmin} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      <Route path="/user">
        {() => (
          <DashboardLayout>
            <UserDashboard />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/user/sponsoring">
        {() => (
          <DashboardLayout>
            <DirectSponsoring />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/user/binary">
        {() => (
          <DashboardLayout>
            <BinaryMatching />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/user/matrix">
        {() => (
          <DashboardLayout>
            <MatrixIncome />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/user/profile">
        {() => (
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/user/confirmation">
        {() => (
          <DashboardLayout>
            <ConfirmationPage />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/user/reentry">
        {() => (
          <DashboardLayout>
            <ReentryPage />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/user/additional-reentry">
        {() => (
          <DashboardLayout>
            <AdditionalReentryPage />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/admin">
        {() => (
          <DashboardLayout isAdmin={true}>
            <AdminDashboard />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/admin/payments">
        {() => (
          <DashboardLayout isAdmin={true}>
            <AdminPayments />
          </DashboardLayout>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </Web3Provider>
    </QueryClientProvider>
  );
}
