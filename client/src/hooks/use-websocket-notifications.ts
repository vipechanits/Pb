import { useEffect, useRef, useState, useCallback } from 'react';
import type { Notification } from '@shared/schema';

interface WebSocketMessage {
  type: 'connected' | 'notification';
  data?: Notification;
  timestamp?: string;
}

export function useWebSocketNotifications(onNotification: (notification: Notification) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const onNotificationRef = useRef(onNotification);
  const intentionalCloseRef = useRef(false);

  // Update ref when callback changes
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const connect = useCallback(() => {

    // Determine WebSocket protocol based on current protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;

    console.log('[WS] Connecting to', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.type === 'notification' && message.data) {
          console.log('[WS] Received notification:', message.data);
          onNotificationRef.current(message.data);
          
          // Send acknowledgement
          ws.send(JSON.stringify({
            type: 'acknowledge',
            notificationId: message.data.id,
          }));
        } else if (message.type === 'connected') {
          console.log('[WS] Connection confirmed at', message.timestamp);
        }
      } catch (error) {
        console.error('[WS] Failed to parse message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] Connection error:', error);
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      setIsConnected(false);
      wsRef.current = null;

      // Only reconnect if this wasn't an intentional close (e.g., cleanup or manual disconnect)
      if (intentionalCloseRef.current) {
        console.log('[WS] Intentional close - skipping reconnect');
        intentionalCloseRef.current = false;
        return;
      }

      // Exponential backoff reconnection
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;

      console.log(`[WS] Reconnecting in ${backoffDelay}ms (attempt ${reconnectAttemptsRef.current})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, backoffDelay);
    };

    return ws;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      // Mark as intentional close to prevent reconnection on cleanup
      intentionalCloseRef.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    reconnect: connect,
  };
}
