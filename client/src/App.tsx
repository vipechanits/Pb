import { Switch, Route } from 'wouter';
import { queryClient, fetchCsrfToken } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { AuthProvider } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import NotFound from '@/pages/not-found';
import Landing from '@/pages/landing';
import LoginPage from '@/pages/auth/login';
import SignupPage from '@/pages/auth/signup';
import ForgotPasswordPage from '@/pages/auth/forgot-password';
import UserDashboard from '@/pages/user-dashboard';
import DirectSponsoring from '@/pages/direct-sponsoring';
import BinaryMatching from '@/pages/binary-matching';
import MatrixIncome from '@/pages/matrix-income';
import Profile from '@/pages/profile';
import ActivationPage from '@/pages/activation';
import ConfirmationPage from '@/pages/confirmation';
import ReentryPage from '@/pages/reentry';
import AdditionalReentryPage from '@/pages/additional-reentry';
import AdminDashboard from '@/pages/admin-dashboard';
import AdminPayments from '@/pages/admin-payments';
import AdminSettings from '@/pages/admin-settings';
import AdminUsers from '@/pages/admin-users';
import { useEffect } from 'react';
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
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/signup" component={SignupPage} />
      <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
      
      <Route path="/user/dashboard">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <UserDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <UserDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/sponsoring">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <DirectSponsoring />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/binary">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <BinaryMatching />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/matrix">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <MatrixIncome />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/profile">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/activation">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <ActivationPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/confirmation">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <ConfirmationPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/reentry">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <ReentryPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/additional-reentry">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <AdditionalReentryPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin/dashboard">
        {() => (
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin">
        {() => (
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin/payments">
        {() => (
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <AdminPayments />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin/settings">
        {() => (
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <AdminSettings />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin/users">
        {() => (
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <AdminUsers />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  // Fetch CSRF token on app load
  useEffect(() => {
    fetchCsrfToken().catch((error) => {
      console.error("Failed to fetch CSRF token:", error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
