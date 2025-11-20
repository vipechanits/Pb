import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useWebSocketNotifications } from '@/hooks/use-websocket-notifications';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import type { Notification } from '@shared/schema';

interface NotificationContextType {
  isMuted: boolean;
  toggleMute: () => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { playDoubleChime, isMuted, toggleMute } = useNotificationSound();

  const handleNotification = useCallback((notification: Notification) => {
    console.log('[NOTIFICATION] Received:', notification);

    // Play double chime sound for important notifications
    const soundTriggers = [
      'payment_confirmed',
      'payment_received',
      'activation_complete',
      'income_earned',
      'binary_match',
    ];

    if (soundTriggers.includes(notification.type)) {
      playDoubleChime();
    }

    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      duration: 5000,
    });

    // Invalidate notification queries to refresh UI
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    queryClient.invalidateQueries({ queryKey: ['/api/activation-payments/pending-count'] });

  }, [playDoubleChime, toast]);

  const { isConnected } = useWebSocketNotifications(handleNotification);

  return (
    <NotificationContext.Provider value={{ isMuted, toggleMute, isConnected }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}
