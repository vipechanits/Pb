/**
 * Notification Helpers
 * Type-safe metadata and message generation for notification system
 */

// Import metadata types from shared schema (single source of truth)
import type {
  NotificationMetadata,
  PaymentReceivedMetadata,
  PaymentConfirmedMetadata,
  PaymentRejectedMetadata,
  IncomeEarnedMetadata,
  ActivationCompleteMetadata,
  ReentryEligibleMetadata,
  NewReferralMetadata,
  BinaryMatchMetadata,
  ProfileIncompleteMetadata,
} from '@shared/schema';

// Re-export for convenience
export type {
  NotificationMetadata,
  PaymentReceivedMetadata,
  PaymentConfirmedMetadata,
  PaymentRejectedMetadata,
  IncomeEarnedMetadata,
  ActivationCompleteMetadata,
  ReentryEligibleMetadata,
  NewReferralMetadata,
  BinaryMatchMetadata,
  ProfileIncompleteMetadata,
};

// Helper to format amount as INR currency
function formatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Number.isInteger(num) ? num.toString() : num.toFixed(0);
}

// Message template helpers
export const NotificationMessages = {
  paymentReceived: (meta: PaymentReceivedMetadata) => ({
    title: 'Payment Received',
    message: `You received ₹${formatAmount(meta.amount)} from ${meta.payerName} (${meta.payerUserId}) for ${formatSlotType(meta.slotType)}. Please confirm or reject this payment.`,
  }),

  paymentConfirmed: (meta: PaymentConfirmedMetadata) => ({
    title: 'Payment Confirmed',
    message: `Your payment of ₹${formatAmount(meta.amount)} to ${meta.receiverName} (${meta.receiverUserId}) for ${formatSlotType(meta.slotType)} has been confirmed.`,
  }),

  paymentRejected: (meta: PaymentRejectedMetadata) => ({
    title: 'Payment Rejected',
    message: `Your payment of ₹${formatAmount(meta.amount)} to ${meta.receiverName} (${meta.receiverUserId}) for ${formatSlotType(meta.slotType)} was rejected. Reason: ${meta.reason}. Please resubmit with correct details.`,
  }),

  incomeEarned: (meta: IncomeEarnedMetadata) => ({
    title: 'Income Earned',
    message: `You earned ₹${formatAmount(meta.amount)} from ${formatIncomeType(meta.incomeType, meta.level)} when ${meta.sourceName} (${meta.sourceUserId}) activated.`,
  }),

  activationComplete: (meta: ActivationCompleteMetadata) => ({
    title: 'Activation Complete',
    message: `Congratulations! Your activation is complete. Total amount: ₹${formatAmount(meta.totalAmount)}. You can now start building your network.`,
  }),

  reentryEligible: (meta: ReentryEligibleMetadata) => ({
    title: 'Re-entry Available',
    message: `Congratulations! You've completed matrix level ${meta.matrixLevel} in cycle ${meta.cycleNumber} and earned ₹${formatAmount(meta.totalEarnings)}. You're now eligible to re-enter the system.`,
  }),

  newReferral: (meta: NewReferralMetadata) => ({
    title: 'New Referral',
    message: `${meta.referralName} (${meta.referralUserId}) joined your team on your ${meta.binaryLeg} leg.`,
  }),

  binaryMatch: (meta: BinaryMatchMetadata) => ({
    title: 'Binary Match Income',
    message: `You earned ₹${formatAmount(meta.amount)} from ${meta.pairsMatched} binary pair matches (Left: ${meta.leftCount}, Right: ${meta.rightCount}).`,
  }),

  profileIncomplete: (meta: ProfileIncompleteMetadata) => ({
    title: 'Complete Your Profile',
    message: `Please complete your profile to unlock all features. Missing fields: ${meta.missingFields.join(', ')}.`,
  }),
};

// Helper to format slot types for display
function formatSlotType(slotType: string): string {
  const typeMap: Record<string, string> = {
    'direct_sponsor': 'Direct Sponsor Payment',
    'binary_match': 'Binary Match Payment',
    'top_reward': 'Top Reward Payment',
    'matrix_level_1': 'Matrix Level 1',
    'matrix_level_2': 'Matrix Level 2',
    'matrix_level_3': 'Matrix Level 3',
    'matrix_level_4': 'Matrix Level 4',
    'matrix_level_5': 'Matrix Level 5',
  };
  return typeMap[slotType] || slotType;
}

// Helper to format income types for display
function formatIncomeType(incomeType: string, level?: number): string {
  if (incomeType.startsWith('matrix_level_') && level) {
    return `Matrix Level ${level}`;
  }
  const typeMap: Record<string, string> = {
    'direct_sponsor': 'Direct Sponsor',
    'binary_match': 'Binary Match',
    'matrix_level_1': 'Matrix Level 1',
    'matrix_level_2': 'Matrix Level 2',
    'matrix_level_3': 'Matrix Level 3',
    'matrix_level_4': 'Matrix Level 4',
    'matrix_level_5': 'Matrix Level 5',
  };
  return typeMap[incomeType] || incomeType;
}
