import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@shared/schema';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Fetch notifications with unread count
  const { data, isLoading } = useQuery<NotificationResponse>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Poll every 30 seconds
    enabled: true,
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/notifications/mark-all-read');
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh notification list and unread count
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      console.error('Failed to mark notifications as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark notifications as read. Please try again.',
      });
    },
  });

  // Mark all as read when dropdown opens (only if there are unread notifications)
  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && data && data.unreadCount > 0) {
      // Await mutation to ensure errors are surfaced
      await markAllAsReadMutation.mutateAsync().catch(() => {
        // Error already handled in onError
      });
    }
  };

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-notification-count"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" data-testid="badge-unread-count">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={`p-4 hover-elevate cursor-pointer ${
        !notification.isRead ? 'bg-accent/5' : ''
      }`}
      data-testid={`notification-${notification.id}`}
    >
      <div className="flex items-start gap-3">
        <NotificationIcon type={notification.type} />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-none">{notification.title}</p>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        {!notification.isRead && (
          <div className="h-2 w-2 rounded-full bg-primary" data-testid="indicator-unread" />
        )}
      </div>
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  // Use different icons based on notification type
  const iconClass = 'h-5 w-5';
  
  switch (type) {
    case 'payment_received':
    case 'payment_confirmed':
    case 'payment_rejected':
      return (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bell className={iconClass} />
        </div>
      );
    case 'income_earned':
    case 'binary_match':
      return (
        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <Bell className={iconClass + ' text-green-600'} />
        </div>
      );
    case 'activation_complete':
    case 'reentry_eligible':
      return (
        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Bell className={iconClass + ' text-blue-600'} />
        </div>
      );
    case 'new_referral':
      return (
        <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Bell className={iconClass + ' text-purple-600'} />
        </div>
      );
    case 'profile_incomplete':
      return (
        <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
          <Bell className={iconClass + ' text-orange-600'} />
        </div>
      );
    default:
      return (
        <div className="h-8 w-8 rounded-full bg-gray-500/10 flex items-center justify-center">
          <Bell className={iconClass} />
        </div>
      );
  }
}
