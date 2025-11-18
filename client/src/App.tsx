import { Switch, Route, useLocation, Link } from 'wouter';
import { queryClient, fetchCsrfToken } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { AuthProvider } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import NotFound from '@/pages/not-found';
import { Button } from '@/components/ui/button';
import { LayoutDashboard } from 'lucide-react';
import Landing from '@/pages/landing';
import LoginPage from '@/pages/auth/login';
import SignupPage from '@/pages/auth/signup';
import ForgotPasswordPage from '@/pages/auth/forgot-password';
import ResetPasswordPage from '@/pages/auth/reset-password';
import VerifyEmailPage from '@/pages/auth/verify-email';
import TermsAndConditions from '@/pages/legal/terms';
import AboutUs from '@/pages/legal/about';
import ContactUs from '@/pages/legal/contact';
import UserDashboard from '@/pages/user-dashboard';
import Profile from '@/pages/profile';
import UserActivationPage from '@/pages/user-activation';
import UserConfirmationPage from '@/pages/user-confirmation';
import UserBinaryTreePage from '@/pages/user-binary-tree';
import UserGlobalMatrixPage from '@/pages/user-global-matrix';
import UserIncomeDetailsPage from '@/pages/user-income-details';
import DirectSponsoringPage from '@/pages/user/direct-sponsoring';
import TransactionHistoryPage from '@/pages/user/transaction-history';
import BinaryMatchQueueHistory from '@/pages/user/binary-match-queue-history';
import BinaryPairMatchingHistory from '@/pages/user/binary-pair-matching-history';
import MatrixIncomeHistory from '@/pages/user/matrix-income-history';
import TicketsPage from '@/pages/user/tickets';
import ReentryPage from '@/pages/reentry';
import AdditionalReentryPage from '@/pages/additional-reentry';
import AdminDashboard from '@/pages/admin-dashboard';
import AdminPayments from '@/pages/admin-payments';
import AdminPaymentsReport from '@/pages/admin-payments-report';
import AdminSettings from '@/pages/admin-settings';
import AdminUsers from '@/pages/admin-users';
import AdminReentry from '@/pages/admin-reentry';
import AdminAnalytics from '@/pages/admin-analytics';
import AdminConfig from '@/pages/admin-config';
import DatabaseBackupPage from '@/pages/admin/database';
import AdminSecurity from '@/pages/admin/security';
import { useEffect } from 'react';
function DashboardLayout({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const style = {
    '--sidebar-width': '24rem',
    '--sidebar-width-icon': '4rem',
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar isAdmin={isAdmin} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <Link href={isAdmin ? "/admin" : "/user"}>
                <Button 
                  variant="default" 
                  size="sm"
                  data-testid="button-dashboard"
                  className="gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <NotificationBell />
              <UserProfileDropdown />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          {!isAdmin && <MobileBottomNav />}
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
      <Route path="/auth/reset-password/:token" component={ResetPasswordPage} />
      <Route path="/auth/verify-email/:token" component={VerifyEmailPage} />
      <Route path="/legal/terms" component={TermsAndConditions} />
      <Route path="/legal/about" component={AboutUs} />
      <Route path="/legal/contact" component={ContactUs} />
      
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
      
      {/* Legacy income page redirects - SPA-friendly */}
      <Route path="/user/sponsoring">
        {() => {
          const [, setLocation] = useLocation();
          setLocation('/user/income/sponsor');
          return null;
        }}
      </Route>
      
      <Route path="/user/binary">
        {() => {
          const [, setLocation] = useLocation();
          setLocation('/user/income/binary');
          return null;
        }}
      </Route>
      
      <Route path="/user/matrix">
        {() => {
          const [, setLocation] = useLocation();
          setLocation('/user/income/matrix');
          return null;
        }}
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
              <UserActivationPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/confirmation">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <UserConfirmationPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/binary-tree">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <UserBinaryTreePage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/global-matrix">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <UserGlobalMatrixPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/direct-sponsoring">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <DirectSponsoringPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/income/:type">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <UserIncomeDetailsPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/transaction-history">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <TransactionHistoryPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/binary-match-queue-history">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <BinaryMatchQueueHistory />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/binary-pair-matching-history">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <BinaryPairMatchingHistory />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/matrix-income-history">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <MatrixIncomeHistory />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/user/tickets">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <TicketsPage />
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
      
      <Route path="/admin/payments-report">
        {() => (
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <AdminPaymentsReport />
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
      
      <Route path="/admin/config">
        {() => (
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <AdminConfig />
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
      
      <Route path="/admin/reentry">
        {() => (
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <AdminReentry />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin/analytics">
        {() => (
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <AdminAnalytics />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin/database">
        {() => (
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <DatabaseBackupPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin/security">
        {() => (
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <AdminSecurity />
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
