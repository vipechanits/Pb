import { WebSocket } from 'ws';

/**
 * WebSocket adapter - Manages user connection registry and broadcast functionality
 * Separated to avoid circular dependencies between notification system and WebSocket server
 */

// Registry mapping userId -> Set of WebSocket connections
export const userConnections = new Map<string, Set<WebSocket>>();

/**
 * Broadcast notification to specific user (all their active connections)
 * Returns true if at least one connection received the notification
 */
export function broadcastToUser(
  userId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    metadata: any;
    createdAt: Date;
  }
): boolean {
  const connections = userConnections.get(userId);
  if (!connections || connections.size === 0) {
    console.log(`[WS] No active connections for user ${userId}`);
    return false;
  }

  const payload = JSON.stringify({
    type: 'notification',
    data: notification
  });

  let successCount = 0;
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
      successCount++;
    }
  });

  console.log(`[WS] Broadcasted notification ${notification.id} to ${successCount} connections for user ${userId}`);
  return successCount > 0;
}

/**
 * Get active connection count for a user
 */
export function getUserConnectionCount(userId: string): number {
  return userConnections.get(userId)?.size || 0;
}
