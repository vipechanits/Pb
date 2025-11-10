import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/auth/login');
    }

    if (!loading && user && requireAdmin && user.role !== 'admin') {
      setLocation('/user/dashboard');
    }

    // Redirect to profile if user requires post-activation profile update
    // Allow access to profile page and auth routes
    if (!loading && user && user.requiresPostActivationProfileUpdate && 
        !location.startsWith('/user/profile') && 
        !location.startsWith('/auth/')) {
      toast({
        title: 'Profile Update Required',
        description: 'Please update your payment details and profile information to continue using the platform.',
        variant: 'default',
      });
      setLocation('/user/profile');
    }
  }, [user, loading, requireAdmin, location, setLocation, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
