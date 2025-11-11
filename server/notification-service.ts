/**
 * Notification Service
 * Orchestrates notification creation for all platform events
 */

import type { IStorage } from './storage';
import type { InsertNotification } from '@shared/schema';
import { NotificationMessages, type NotificationMetadata } from './notification-helpers';

export class NotificationService {
  constructor(private storage: IStorage) {}

  // Payment notification helpers
  async notifyPaymentReceived(params: {
    receiverUserId: string;
    payerUserId: string;
    payerName: string;
    amount: string;
    slotType: string;
    activationId: string;
    paymentId: string;
  }): Promise<void> {
    const metadata = {
      type: 'payment_received' as const,
      amount: params.amount,
      slotType: params.slotType,
      payerUserId: params.payerUserId,
      payerName: params.payerName,
      activationId: params.activationId,
    };

    const { title, message } = NotificationMessages.paymentReceived(metadata);

    await this.storage.createNotification({
      userId: params.receiverUserId,
      type: 'payment_received',
      title,
      message,
      relatedEntityType: 'payment',
      relatedEntityId: params.paymentId,
      metadata: metadata,
      isRead: false,
    });
  }

  async notifyPaymentConfirmed(params: {
    payerUserId: string;
    receiverUserId: string;
    receiverName: string;
    amount: string;
    slotType: string;
    activationId: string;
    paymentId: string;
  }): Promise<void> {
    const metadata = {
      type: 'payment_confirmed' as const,
      amount: params.amount,
      slotType: params.slotType,
      receiverUserId: params.receiverUserId,
      receiverName: params.receiverName,
      activationId: params.activationId,
    };

    const { title, message } = NotificationMessages.paymentConfirmed(metadata);

    await this.storage.createNotification({
      userId: params.payerUserId,
      type: 'payment_confirmed',
      title,
      message,
      relatedEntityType: 'payment',
      relatedEntityId: params.paymentId,
      metadata: metadata,
      isRead: false,
    });
  }

  async notifyPaymentRejected(params: {
    payerUserId: string;
    receiverUserId: string;
    receiverName: string;
    amount: string;
    slotType: string;
    reason: string;
    activationId: string;
    paymentId: string;
  }): Promise<void> {
    const metadata = {
      type: 'payment_rejected' as const,
      amount: params.amount,
      slotType: params.slotType,
      receiverUserId: params.receiverUserId,
      receiverName: params.receiverName,
      reason: params.reason,
      activationId: params.activationId,
    };

    const { title, message } = NotificationMessages.paymentRejected(metadata);

    await this.storage.createNotification({
      userId: params.payerUserId,
      type: 'payment_rejected',
      title,
      message,
      relatedEntityType: 'payment',
      relatedEntityId: params.paymentId,
      metadata: metadata,
      isRead: false,
    });
  }

  // Income notification helper
  async notifyIncomeEarned(params: {
    receiverUserId: string;
    amount: string;
    incomeType: string;
    sourceUserId: string;
    sourceName: string;
    level?: number;
    incomeTransactionId: string;
  }): Promise<void> {
    const metadata = {
      type: 'income_earned' as const,
      amount: params.amount,
      incomeType: params.incomeType,
      sourceUserId: params.sourceUserId,
      sourceName: params.sourceName,
      level: params.level,
    };

    const { title, message } = NotificationMessages.incomeEarned(metadata);

    await this.storage.createNotification({
      userId: params.receiverUserId,
      type: 'income_earned',
      title,
      message,
      relatedEntityType: 'income',
      relatedEntityId: params.incomeTransactionId,
      metadata: metadata,
      isRead: false,
    });
  }

  // Activation notification helper
  async notifyActivationComplete(params: {
    userId: string;
    activationId: string;
    totalAmount: string;
    completedAt: Date;
  }): Promise<void> {
    const metadata = {
      type: 'activation_complete' as const,
      activationId: params.activationId,
      totalAmount: params.totalAmount,
      completedAt: params.completedAt.toISOString(),
    };

    const { title, message } = NotificationMessages.activationComplete(metadata);

    await this.storage.createNotification({
      userId: params.userId,
      type: 'activation_complete',
      title,
      message,
      relatedEntityType: 'activation',
      relatedEntityId: params.activationId,
      metadata: metadata,
      isRead: false,
    });
  }

  // Re-entry notification helper
  async notifyReentryEligible(params: {
    userId: string;
    cycleNumber: number;
    matrixLevel: number;
    totalEarnings: string;
    reentryId: string;
  }): Promise<void> {
    const metadata = {
      type: 'reentry_eligible' as const,
      cycleNumber: params.cycleNumber,
      matrixLevel: params.matrixLevel,
      totalEarnings: params.totalEarnings,
    };

    const { title, message } = NotificationMessages.reentryEligible(metadata);

    await this.storage.createNotification({
      userId: params.userId,
      type: 'reentry_eligible',
      title,
      message,
      relatedEntityType: 'reentry',
      relatedEntityId: params.reentryId,
      metadata: metadata,
      isRead: false,
    });
  }

  // Referral notification helper
  async notifyNewReferral(params: {
    sponsorUserId: string;
    referralUserId: string;
    referralName: string;
    referralEmail: string;
    binaryLeg: 'left' | 'right';
  }): Promise<void> {
    const metadata = {
      type: 'new_referral' as const,
      referralUserId: params.referralUserId,
      referralName: params.referralName,
      referralEmail: params.referralEmail,
      binaryLeg: params.binaryLeg,
    };

    const { title, message } = NotificationMessages.newReferral(metadata);

    await this.storage.createNotification({
      userId: params.sponsorUserId,
      type: 'new_referral',
      title,
      message,
      relatedEntityType: 'user',
      relatedEntityId: params.referralUserId,
      metadata: metadata,
      isRead: false,
    });
  }

  // Binary match notification helper
  async notifyBinaryMatch(params: {
    userId: string;
    amount: string;
    leftCount: number;
    rightCount: number;
    pairsMatched: number;
  }): Promise<void> {
    const metadata = {
      type: 'binary_match' as const,
      amount: params.amount,
      leftCount: params.leftCount,
      rightCount: params.rightCount,
      pairsMatched: params.pairsMatched,
    };

    const { title, message } = NotificationMessages.binaryMatch(metadata);

    await this.storage.createNotification({
      userId: params.userId,
      type: 'binary_match',
      title,
      message,
      relatedEntityType: null,
      relatedEntityId: null,
      metadata: metadata,
      isRead: false,
    });
  }

  // Profile incomplete reminder
  async notifyProfileIncomplete(params: {
    userId: string;
    missingFields: string[];
  }): Promise<void> {
    const metadata = {
      type: 'profile_incomplete' as const,
      missingFields: params.missingFields,
    };

    const { title, message } = NotificationMessages.profileIncomplete(metadata);

    await this.storage.createNotification({
      userId: params.userId,
      type: 'profile_incomplete',
      title,
      message,
      relatedEntityType: null,
      relatedEntityId: null,
      metadata: metadata,
      isRead: false,
    });
  }
}
