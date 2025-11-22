import { notificationRepository } from './notification-repository';
import { broadcastToUser } from './websocket-adapter';
import type { InsertNotification } from '@shared/schema';
import { db } from './db';
import { systemConfig } from '@shared/schema';

// Helper to format amount as INR currency (whole numbers)
function formatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Number.isInteger(num) ? num.toString() : num.toFixed(0);
}

/**
 * Central notification service that handles both database persistence and WebSocket delivery
 */
export class NotificationService {
  /**
   * Create and broadcast a notification to a user
   * Stores in database and immediately pushes via WebSocket if user is online
   * Respects global adminNotificationsEnabled toggle
   */
  async notify(notification: InsertNotification): Promise<string> {
    // Check if notifications are globally enabled
    const config = await db.query.systemConfig.findFirst();
    if (config && !config.adminNotificationsEnabled) {
      // Return empty ID if notifications are disabled - don't create or broadcast
      return '';
    }
    
    // 1. Persist notification to database
    const createdNotification = await notificationRepository.createNotification(notification);
    
    // 2. Try to broadcast via WebSocket (if user is connected)
    const delivered = broadcastToUser(notification.userId, {
      id: createdNotification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      createdAt: createdNotification.createdAt,
    });
    
    // 3. Mark as delivered if WebSocket push succeeded
    if (delivered) {
      await notificationRepository.markNotificationDelivered(createdNotification.id);
    }
    
    return createdNotification.id;
  }

  /**
   * Send payment confirmation notification with bell sound trigger
   */
  async notifyPaymentConfirmed(
    userId: string,
    amount: string,
    slotType: string,
    receiverUserId: string,
    receiverName: string,
    activationId: string
  ): Promise<void> {
    await this.notify({
      userId,
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      message: `Your ₹${formatAmount(amount)} payment for ${slotType} has been confirmed by ${receiverName}`,
      relatedEntityType: 'activation_payment',
      relatedEntityId: activationId,
      metadata: {
        type: 'payment_confirmed',
        amount,
        slotType,
        receiverUserId,
        receiverName,
        activationId,
      },
    });
  }

  /**
   * Send activation complete notification with bell sound trigger
   */
  async notifyActivationComplete(
    userId: string,
    activationId: string,
    totalAmount: string
  ): Promise<void> {
    await this.notify({
      userId,
      type: 'activation_complete',
      title: 'Activation Complete',
      message: `Congratulations! Your activation is complete. Total paid: ₹${formatAmount(totalAmount)}`,
      relatedEntityType: 'activation',
      relatedEntityId: activationId,
      metadata: {
        type: 'activation_complete',
        activationId,
        totalAmount,
        completedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Send new referral notification (tree update)
   */
  async notifyNewReferral(
    sponsorId: string,
    referralUserId: string,
    referralName: string,
    referralEmail: string,
    binaryLeg: 'left' | 'right'
  ): Promise<void> {
    await this.notify({
      userId: sponsorId,
      type: 'new_referral',
      title: 'New Team Member',
      message: `${referralName} joined your ${binaryLeg} leg`,
      relatedEntityType: 'user',
      relatedEntityId: referralUserId,
      metadata: {
        type: 'new_referral',
        referralUserId,
        referralName,
        referralEmail,
        binaryLeg,
      },
    });
  }

  /**
   * Send income earned notification with bell sound trigger
   */
  async notifyIncomeEarned(
    userId: string,
    amount: string,
    incomeType: string,
    sourceUserId: string,
    sourceName: string,
    level?: number
  ): Promise<void> {
    const levelText = level ? ` (Level ${level})` : '';
    await this.notify({
      userId,
      type: 'income_earned',
      title: 'Income Earned',
      message: `You earned ₹${formatAmount(amount)} from ${incomeType}${levelText}`,
      relatedEntityType: 'income',
      relatedEntityId: sourceUserId,
      metadata: {
        type: 'income_earned',
        amount,
        incomeType,
        sourceUserId,
        sourceName,
        level,
      },
    });
  }

  /**
   * Send payment received notification (for receivers)
   */
  async notifyPaymentReceived(
    receiverId: string,
    amount: string,
    slotType: string,
    payerUserId: string,
    payerName: string,
    activationId: string
  ): Promise<void> {
    await this.notify({
      userId: receiverId,
      type: 'payment_received',
      title: 'Payment Received',
      message: `${payerName} paid you ₹${formatAmount(amount)} for ${slotType}`,
      relatedEntityType: 'activation_payment',
      relatedEntityId: activationId,
      metadata: {
        type: 'payment_received',
        amount,
        slotType,
        payerUserId,
        payerName,
        activationId,
      },
    });
  }
}

export const notificationService = new NotificationService();
