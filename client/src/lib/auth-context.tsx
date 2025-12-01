import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, resetCsrfToken, fetchCsrfToken } from './queryClient';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  login: (userId: string, password: string, recaptchaToken?: string) => Promise<Omit<User, 'password'>>;
  loginWithPin: (userId: string, pin: string) => Promise<Omit<User, 'password'>>;
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

  const login = async (userId: string, password: string, recaptchaToken?: string) => {
    try {
      // Step 1: Submit login credentials
      const response = await apiRequest('POST', '/api/auth/login', { userId, password, recaptchaToken });
      const data = await response.json();
      
      // Step 2: Fetch fresh CSRF token to ensure it's established
      await fetchCsrfToken();
      
      // Step 3: Verify session is established by fetching current user
      const meResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (meResponse.ok) {
        const meData = await meResponse.json();
        setUser(meData.user);
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
        return meData.user;
      } else {
        // Session verification failed, but login succeeded - set user from login response
        setUser(data.user);
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
        return data.user;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithPin = async (userId: string, pin: string) => {
    try {
      // Step 1: Submit PIN login credentials
      const response = await apiRequest('POST', '/api/auth/login-with-pin', { userId, pin });
      const data = await response.json();
      
      // Step 2: Fetch fresh CSRF token to ensure it's established
      await fetchCsrfToken();
      
      // Step 3: Verify session is established by fetching current user
      const meResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (meResponse.ok) {
        const meData = await meResponse.json();
        setUser(meData.user);
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in with your PIN.',
        });
        return meData.user;
      } else {
        // Session verification failed, but login succeeded - set user from login response
        setUser(data.user);
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in with your PIN.',
        });
        return data.user;
      }
    } catch (error) {
      console.error('PIN login error:', error);
      throw error;
    }
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
    <AuthContext.Provider value={{ user, loading, login, loginWithPin, logout, signup, refreshUser }}>
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
