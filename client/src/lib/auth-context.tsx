import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, resetCsrfToken } from './queryClient';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  login: (email: string, password: string, recaptchaToken?: string) => Promise<Omit<User, 'password'>>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, sponsorId?: string, binaryLeg?: string) => Promise<Omit<User, 'password'>>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string, recaptchaToken?: string) => {
    const response = await apiRequest('POST', '/api/auth/login', { email, password, recaptchaToken });
    const data = await response.json();
    setUser(data.user);
    toast({
      title: 'Welcome back!',
      description: 'You have successfully logged in.',
    });
    return data.user;
  };

  const signup = async (email: string, password: string, sponsorId?: string, binaryLeg?: string) => {
    const response = await apiRequest('POST', '/api/auth/signup', { email, password, sponsorId, binaryLeg });
    const data = await response.json();
    setUser(data.user);
    toast({
      title: 'Account created!',
      description: 'Welcome to PAYBACK247.',
    });
    return data.user;
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
    } catch (error) {
      // Ignore logout errors, still clear local state
      console.error('Logout error:', error);
    }
    // Clear CSRF token since session is ending
    resetCsrfToken();
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
