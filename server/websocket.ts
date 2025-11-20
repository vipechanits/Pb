import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import type { Server } from 'http';
import type { SessionData } from 'express-session';
import { notificationRepository } from './notification-repository';
import { userConnections } from './websocket-adapter';

// Type for WebSocket with user info
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

// Parse session cookie from headers
function parseSessionFromCookie(req: IncomingMessage): string | null {
  const cookies = req.headers.cookie;
  if (!cookies) return null;
  
  const sessionCookie = cookies
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('connect.sid='));
  
  if (!sessionCookie) return null;
  
  // Extract session ID from cookie (format: connect.sid=s%3A<sessionId>.<signature>)
  const match = sessionCookie.match(/connect\.sid=s%3A([^.]+)\./);
  return match ? match[1] : null;
}

// Initialize WebSocket server
export function initializeWebSocketServer(server: Server, sessionStore: any, cookieSecret: string) {
  const wss = new WebSocketServer({ 
    noServer: true,
    path: '/ws/notifications'
  });

  // Handle WebSocket upgrade with session authentication
  server.on('upgrade', async (req, socket, head) => {
    if (req.url !== '/ws/notifications') {
      socket.destroy();
      return;
    }

    try {
      // Extract session ID from cookie
      const sessionId = parseSessionFromCookie(req);
      if (!sessionId) {
        console.log('[WS] No session cookie found');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Load session from store
      sessionStore.get(sessionId, (err: Error, session: SessionData) => {
        if (err || !session || !session.userId) {
          console.log('[WS] Invalid or expired session');
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        // Upgrade connection
        wss.handleUpgrade(req, socket, head, (ws: AuthenticatedWebSocket) => {
          ws.userId = session.userId;
          ws.isAlive = true;
          wss.emit('connection', ws, req);
        });
      });
    } catch (error) {
      console.error('[WS] Upgrade error:', error);
      socket.destroy();
    }
  });

  // Handle new WebSocket connections
  wss.on('connection', async (ws: AuthenticatedWebSocket) => {
    const userId = ws.userId;
    if (!userId) {
      ws.close();
      return;
    }

    console.log(`[WS] User ${userId} connected`);

    // Add to registry
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString()
    }));

    // Replay undelivered notifications
    try {
      const undeliveredNotifications = await notificationRepository.getUndeliveredNotifications(userId);
      
      if (undeliveredNotifications.length > 0) {
        console.log(`[WS] Replaying ${undeliveredNotifications.length} undelivered notifications for user ${userId}`);
        
        for (const notification of undeliveredNotifications) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'notification',
              data: {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                metadata: notification.metadata,
                createdAt: notification.createdAt,
              }
            }));
            
            // Mark as delivered
            await notificationRepository.markNotificationDelivered(notification.id);
          }
        }
      }
    } catch (error) {
      console.error(`[WS] Failed to replay undelivered notifications for user ${userId}:`, error);
    }

    // Heartbeat to detect broken connections
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages from client
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'acknowledge' && message.notificationId) {
          console.log(`[WS] User ${userId} acknowledged notification ${message.notificationId}`);
          
          // Mark notification as acknowledged in database
          try {
            await notificationRepository.markNotificationAcknowledged(message.notificationId);
            console.log(`[WS] Notification ${message.notificationId} marked as acknowledged`);
          } catch (error) {
            console.error(`[WS] Failed to mark notification as acknowledged:`, error);
          }
        }
      } catch (error) {
        console.error('[WS] Message parse error:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log(`[WS] User ${userId} disconnected`);
      const connections = userConnections.get(userId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          userConnections.delete(userId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error(`[WS] Connection error for user ${userId}:`, error);
    });
  });

  // Heartbeat interval to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Every 30 seconds

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  console.log('[WS] WebSocket server initialized on /ws/notifications');

  return { wss, userConnections };
}
