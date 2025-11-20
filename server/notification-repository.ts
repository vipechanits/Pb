import { db } from './db';
import { notifications, type Notification, type InsertNotification } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Notification repository - Handles database operations for notifications
 * Separated to avoid circular dependencies between storage.ts and notifications.ts
 */
export class NotificationRepository {
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications)
      .values(notification)
      .returning();
    
    console.log(`[NOTIF-REPO] Created notification ${result[0].id} for user ${notification.userId}`);
    return result[0];
  }

  async getUndeliveredNotifications(userId: string): Promise<Notification[]> {
    const results = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        isNull(notifications.deliveredAt)
      ))
      .orderBy(notifications.createdAt);
    
    return results;
  }

  async markNotificationDelivered(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ deliveredAt: new Date() })
      .where(eq(notifications.id, notificationId));
    
    console.log(`[NOTIF-REPO] Marked notification ${notificationId} as delivered`);
  }

  async markNotificationAcknowledged(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ acknowledgedAt: new Date() })
      .where(eq(notifications.id, notificationId));
    
    console.log(`[NOTIF-REPO] Marked notification ${notificationId} as acknowledged`);
  }
}

export const notificationRepository = new NotificationRepository();
